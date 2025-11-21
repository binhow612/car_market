import os
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image, ImageOps
from torch.utils.data import Dataset, DataLoader
import numpy as np
import faiss
import pandas as pd
from tqdm import tqdm
import glob
import gc
import warnings

# Tắt bớt cảnh báo xFormers cho đỡ rối mắt
warnings.filterwarnings("ignore", category=UserWarning)

# --- CẤU HÌNH ---
# Thay đường dẫn tới dataset DVM của bạn
DATASET_ROOT = r"C:\Users\A514-54\Downloads\resized_DVM_v2\resized_DVM"
TARGET_BRANDS = [
    "Toyota", "Hyundai", "Kia", "Honda", "Mazda", 
    "Ford", "Mitsubishi", "Mercedes-Benz", "BMW", "Lexus" 
]
# DINOv2 nặng hơn ResNet, nếu máy lag hãy giảm xuống 16
BATCH_SIZE = 32 
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --- 1. TRANSFORM MỚI: PADDING (GIỮ TỈ LỆ ẢNH) ---
class SquarePad:
    def __call__(self, image):
        w, h = image.size
        max_wh = np.max([w, h])
        hp = int((max_wh - w) / 2)
        vp = int((max_wh - h) / 2)
        padding = (hp, vp, hp, vp)
        return ImageOps.expand(image, padding, fill=0)

# DINOv2 kích thước chuẩn là bội số của 14 (224, 518...)
transform_pipeline = transforms.Compose([
    SquarePad(),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

class DVMCarDataset(Dataset):
    def __init__(self, root_dir, target_brands, transform=None):
        self.image_paths = []
        self.labels = [] 
        self.transform = transform
        print(f"Đang quét dữ liệu (DINOv2 Version)...")
        if os.path.exists(root_dir):
            for brand in os.listdir(root_dir):
                if brand in target_brands:
                    brand_dir = os.path.join(root_dir, brand)
                    if os.path.isdir(brand_dir):
                        for root, _, files in os.walk(brand_dir):
                            for file in files:
                                if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                                    self.image_paths.append(os.path.join(root, file))
                                    self.labels.append(brand)
        print(f"-> Tổng cộng: {len(self.image_paths)} ảnh.")

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        try:
            image = Image.open(img_path).convert('RGB')
            if self.transform:
                image = self.transform(image)
            return image, img_path, self.labels[idx]
        except:
            return torch.zeros((3, 224, 224)), "error", "error"

# --- 2. MODEL DINOv2 (VISION TRANSFORMER) ---
class CarEmbedder(nn.Module):
    def __init__(self):
        super(CarEmbedder, self).__init__()
        print("Đang tải DINOv2 (Small)...")
        # Tải model DINOv2 Small từ Facebook Research
        self.model = torch.hub.load('facebookresearch/dinov2', 'dinov2_vits14')
    
    def forward(self, x):
        # DINOv2 trả về features trực tiếp
        return self.model(x)

# --- 3. BUILD INDEX (SAFE MODE) ---
def build_search_index_v2():
    # Tạo thư mục riêng cho v2
    os.makedirs("checkpoints_v2", exist_ok=True) 
    
    dataset = DVMCarDataset(DATASET_ROOT, TARGET_BRANDS, transform=transform_pipeline)
    if len(dataset) == 0: return

    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)
    
    model = CarEmbedder().to(DEVICE)
    model.eval()

    temp_embeddings = []
    temp_metadata = []
    
    # Resume logic
    existing_parts = glob.glob("checkpoints_v2/part_*.npy")
    num_existing = len(existing_parts)
    SAVE_INTERVAL = 50 
    start_batch_idx = num_existing * SAVE_INTERVAL
    
    if num_existing > 0:
        print(f"!!! RESUME: Bỏ qua {start_batch_idx} batch đầu...")

    batch_counter = 0
    part_counter = num_existing

    print(f"Bắt đầu trích xuất với DINOv2 trên {DEVICE}...")
    
    with torch.no_grad():
        for i, (images, paths, brands) in enumerate(tqdm(dataloader)):
            if i < start_batch_idx: continue
            
            images = images.to(DEVICE)
            
            # --- FIX LỖI CONTIGUOUS Ở ĐÂY ---
            # 1. Lấy numpy array
            embeddings = model(images).cpu().numpy()
            
            # 2. Ép kiểu float32 (FAISS yêu cầu) và sắp xếp lại bộ nhớ (C-contiguous)
            embeddings = np.ascontiguousarray(embeddings, dtype=np.float32)
            
            # 3. Normalize
            faiss.normalize_L2(embeddings)
            
            temp_embeddings.append(embeddings)
            for p, b in zip(paths, brands):
                temp_metadata.append({"path": p, "brand": b})
            
            batch_counter += 1

            if batch_counter >= SAVE_INTERVAL:
                part_emb = np.vstack(temp_embeddings)
                part_meta = pd.DataFrame(temp_metadata)
                np.save(f"checkpoints_v2/part_{part_counter}.npy", part_emb)
                part_meta.to_csv(f"checkpoints_v2/part_{part_counter}.csv", index=False)
                
                tqdm.write(f" -> Saved part {part_counter}")
                temp_embeddings = []
                temp_metadata = []
                batch_counter = 0
                part_counter += 1
                gc.collect()

        if temp_embeddings:
            part_emb = np.vstack(temp_embeddings)
            part_meta = pd.DataFrame(temp_metadata)
            np.save(f"checkpoints_v2/part_{part_counter}.npy", part_emb)
            part_meta.to_csv(f"checkpoints_v2/part_{part_counter}.csv", index=False)

    # Merge
    print("\nĐang gộp file...")
    all_parts_npy = sorted(glob.glob("checkpoints_v2/part_*.npy"), key=lambda x: int(x.split('_')[-1].split('.')[0]))
    all_parts_csv = sorted(glob.glob("checkpoints_v2/part_*.csv"), key=lambda x: int(x.split('_')[-1].split('.')[0]))
    
    if not all_parts_npy: return

    # Load gộp (Lưu ý RAM)
    full_embeddings = np.vstack([np.load(f) for f in all_parts_npy])
    full_metadata = pd.concat([pd.read_csv(f) for f in all_parts_csv], ignore_index=True)
    
    # Fix lỗi contiguous lần nữa khi gộp (cho chắc chắn)
    full_embeddings = np.ascontiguousarray(full_embeddings, dtype=np.float32)

    print(f"Building Index V2: {full_embeddings.shape}...")
    # DINOv2 Small output dimension = 384 (khác với 2048 của ResNet)
    index = faiss.IndexFlatIP(384) 
    index.add(full_embeddings)
    
    # Lưu tên file có hậu tố _v2
    faiss.write_index(index, "car_search_index_v2.faiss")
    full_metadata.to_csv("car_metadata_v2.csv", index=False)
    print("DONE! Saved 'car_search_index_v2.faiss' & 'car_metadata_v2.csv'.")

if __name__ == "__main__":
    build_search_index_v2()