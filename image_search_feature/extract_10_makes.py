import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from torch.utils.data import Dataset, DataLoader
import numpy as np
import faiss
import pandas as pd
from tqdm import tqdm
import glob
import gc  # Garbage Collector để dọn dẹp RAM

# --- CẤU HÌNH ---
# Đường dẫn dataset của bạn
DATASET_ROOT = r"C:\Users\A514-54\Downloads\resized_DVM_v2\resized_DVM"

# Danh sách 10 hãng phổ biến
TARGET_BRANDS = [
    "Toyota", "Hyundai", "Kia", "Honda", "Mazda", 
    "Ford", "Mitsubishi", "Mercedes-Benz", "BMW", "Lexus" 
]

# Giảm Batch size xuống 32 để an toàn cho Laptop
BATCH_SIZE = 32 
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --- 1. CHUẨN BỊ DATASET & DATALOADER ---
class DVMCarDataset(Dataset):
    def __init__(self, root_dir, target_brands, transform=None):
        self.image_paths = []
        self.labels = [] 
        self.transform = transform
        
        print(f"Đang quét dữ liệu tại: {root_dir}")
        print(f"Các hãng mục tiêu: {target_brands}")
        
        # Quét thư mục
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
        else:
            print(f"CẢNH BÁO: Không tìm thấy đường dẫn {root_dir}")
        
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
        except Exception as e:
            # Trả về ảnh đen nếu lỗi để không crash chương trình
            return torch.zeros((3, 224, 224)), "error", "error"

# Transform ResNet
transform_pipeline = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# --- 2. MÔ HÌNH EMBEDDING ---
class CarEmbedder(nn.Module):
    def __init__(self):
        super(CarEmbedder, self).__init__()
        # Dùng ResNet50
        weights = models.ResNet50_Weights.DEFAULT
        base_model = models.resnet50(weights=weights)
        self.features = nn.Sequential(*list(base_model.children())[:-1])
        
    def forward(self, x):
        x = self.features(x)
        return torch.flatten(x, 1)

# --- 3. HÀM BUILD INDEX AN TOÀN (SAFE MODE) ---
def build_search_index_safe():
    # Tạo thư mục chứa file tạm
    os.makedirs("checkpoints", exist_ok=True)
    
    # Khởi tạo dataset
    dataset = DVMCarDataset(DATASET_ROOT, TARGET_BRANDS, transform=transform_pipeline)
    if len(dataset) == 0:
        return

    # Giảm num_workers xuống 2 để đỡ lag máy
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

    model = CarEmbedder().to(DEVICE)
    model.eval()

    temp_embeddings = []
    temp_metadata = []
    
    # KIỂM TRA FILE CŨ ĐỂ RESUME
    existing_parts = glob.glob("checkpoints/part_*.npy")
    num_existing = len(existing_parts)
    
    # Mỗi lần save là 50 batch. Tính ra batch bắt đầu.
    SAVE_INTERVAL = 50 
    start_batch_idx = num_existing * SAVE_INTERVAL
    
    if num_existing > 0:
        print(f"!!! PHÁT HIỆN CHẠY LẠI: Đã có {num_existing} phần lưu trữ.")
        print(f"!!! Sẽ bỏ qua {start_batch_idx} batch đầu tiên và chạy tiếp...")

    batch_counter = 0 # Đếm số batch trong phiên hiện tại để quyết định khi nào save
    part_counter = num_existing # Đánh số part tiếp theo

    print(f"Bắt đầu xử lý trên thiết bị: {DEVICE}")
    
    with torch.no_grad():
        for i, (images, paths, brands) in enumerate(tqdm(dataloader)):
            
            # LOGIC BỎ QUA (SKIP) NẾU ĐÃ LÀM RỒI
            if i < start_batch_idx:
                continue
            
            images = images.to(DEVICE)
            
            # Feature Extraction
            embeddings = model(images).cpu().numpy()
            faiss.normalize_L2(embeddings)
            
            temp_embeddings.append(embeddings)
            
            # Metadata
            for p, b in zip(paths, brands):
                temp_metadata.append({"path": p, "brand": b})
            
            batch_counter += 1

            # --- CHECKPOINT SAVE ---
            # Cứ đủ 50 batch thì lưu xuống đĩa 1 lần
            if batch_counter >= SAVE_INTERVAL:
                part_emb = np.vstack(temp_embeddings)
                part_meta = pd.DataFrame(temp_metadata)
                
                # Lưu file
                np.save(f"checkpoints/part_{part_counter}.npy", part_emb)
                part_meta.to_csv(f"checkpoints/part_{part_counter}.csv", index=False)
                
                tqdm.write(f" -> [SAFE SAVE] Đã lưu phần {part_counter} xuống ổ cứng.")
                
                # Dọn dẹp RAM
                temp_embeddings = []
                temp_metadata = []
                batch_counter = 0
                part_counter += 1
                gc.collect() # Bắt buộc dọn rác bộ nhớ

        # --- LƯU PHẦN CUỐI CÙNG (nếu còn dư) ---
        if temp_embeddings:
            part_emb = np.vstack(temp_embeddings)
            part_meta = pd.DataFrame(temp_metadata)
            np.save(f"checkpoints/part_{part_counter}.npy", part_emb)
            part_meta.to_csv(f"checkpoints/part_{part_counter}.csv", index=False)
            print(f" -> Đã lưu phần cuối cùng {part_counter}")

    # --- GIAI ĐOẠN MERGE (GỘP FILE) ---
    print("\nĐang gộp các file checkpoints thành index cuối cùng...")
    all_parts_npy = sorted(glob.glob("checkpoints/part_*.npy"), key=lambda x: int(x.split('_')[-1].split('.')[0]))
    all_parts_csv = sorted(glob.glob("checkpoints/part_*.csv"), key=lambda x: int(x.split('_')[-1].split('.')[0]))
    
    if not all_parts_npy:
        print("Không có dữ liệu để gộp.")
        return

    # Load từng cái
    try:
        full_embeddings = np.vstack([np.load(f) for f in all_parts_npy])
        full_metadata = pd.concat([pd.read_csv(f) for f in all_parts_csv], ignore_index=True)
    except MemoryError:
        print("LỖI RAM KHI GỘP: Máy không đủ RAM để gộp tất cả cùng lúc.")
        print("Giải pháp: Dữ liệu checkpoints vẫn còn an toàn. Bạn có thể gộp trên máy mạnh hơn.")
        return

    # Build FAISS Index
    print(f"Tạo Index cho {full_embeddings.shape[0]} ảnh (Dims={full_embeddings.shape[1]})...")
    index = faiss.IndexFlatIP(2048)
    index.add(full_embeddings)
    
    # Lưu file kết quả cuối
    faiss.write_index(index, "car_search_index.faiss")
    full_metadata.to_csv("car_metadata.csv", index=False)
    
    print("------------------------------------------------")
    print("HOÀN TẤT! File 'car_search_index.faiss' đã sẵn sàng.")
    print("Bạn có thể xóa thư mục 'checkpoints' để giải phóng ổ cứng.")
    print("------------------------------------------------")

# --- 4. HÀM TÌM KIẾM ---
def search_similar_cars(query_img_path, k=5):
    if not os.path.exists("car_search_index.faiss"):
        print("Chưa tìm thấy file index. Vui lòng chạy build_search_index_safe() trước.")
        return

    index = faiss.read_index("car_search_index.faiss")
    df = pd.read_csv("car_metadata.csv")
    
    model = CarEmbedder().to(DEVICE)
    model.eval()
    
    try:
        img = Image.open(query_img_path).convert('RGB')
        input_tensor = transform_pipeline(img).unsqueeze(0).to(DEVICE)
        
        with torch.no_grad():
            query_vector = model(input_tensor).cpu().numpy()
            faiss.normalize_L2(query_vector)
        
        D, I = index.search(query_vector, k)
        
        print(f"\n--- KẾT QUẢ TÌM KIẾM: {os.path.basename(query_img_path)} ---")
        results = []
        for i, idx in enumerate(I[0]):
            if idx < len(df):
                match_info = df.iloc[idx]
                score = D[0][i]
                print(f"Top {i+1}: {match_info['brand']} | Score: {score:.4f} | Path: {match_info['path']}")
                results.append(match_info)
        return results
    except Exception as e:
        print(f"Lỗi khi tìm kiếm: {e}")
        return []

# --- MAIN ---
if __name__ == "__main__":
    # BƯỚC 1: CHẠY DÒNG NÀY ĐỂ TẠO DỮ LIỆU (Sẽ mất thời gian)
    # Nếu bị lỗi/tắt máy, chỉ cần chạy lại dòng này, nó tự làm tiếp.
    build_search_index_safe()
    
    # BƯỚC 2: SAU KHI CHẠY XONG BƯỚC 1, MỞ COMMENT DÒNG DƯỚI ĐỂ TEST
    # search_similar_cars(r"path\to\your\test_image.jpg")