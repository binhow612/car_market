import os
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image, ImageOps
import numpy as np
import faiss
import pandas as pd
from ultralytics import YOLO
from tqdm import tqdm
from tabulate import tabulate
import warnings

warnings.filterwarnings("ignore")

# --- CẤU HÌNH V2 ---
TEST_DIR = "car_images"  # Folder ảnh Google bạn đã tải
INDEX_FILE = "car_search_index_v2.faiss" # File index mới
METADATA_FILE = "car_metadata_v2.csv"    # File metadata mới
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Mapping tên folder -> tên hãng trong dataset
BRAND_MAPPING = {
    "Toyota": "Toyota", "Honda": "Honda", "Mazda": "Mazda",
    "Hyundai": "Hyundai", "Kia": "Kia", "Mitsubishi": "Mitsubishi",
    "Ford": "Ford", "BMW": "BMW", "Mercedes": "Mercedes-Benz", "Lexus": "Lexus"
}

# --- 1. TRANSFORM V2 (PADDING) ---
class SquarePad:
    def __call__(self, image):
        w, h = image.size
        max_wh = np.max([w, h])
        hp = int((max_wh - w) / 2)
        vp = int((max_wh - h) / 2)
        padding = (hp, vp, hp, vp)
        return ImageOps.expand(image, padding, fill=0)

transform_pipeline = transforms.Compose([
    SquarePad(),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# --- 2. MODEL V2 (DINOv2) ---
class CarEmbedder(nn.Module):
    def __init__(self):
        super(CarEmbedder, self).__init__()
        print("Loading DINOv2 Model...", end="")
        self.model = torch.hub.load('facebookresearch/dinov2', 'dinov2_vits14')
        print(" Done!")
        
    def forward(self, x):
        return self.model(x)

# --- 3. SMART CROP (YOLO) ---
def smart_crop(image):
    try:
        model = YOLO("yolov8n.pt")
        results = model(image, verbose=False)
        target_classes = [2, 5, 7]
        best_box = None
        max_area = 0
        for r in results:
            for box in r.boxes:
                if int(box.cls[0]) in target_classes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    area = (x2 - x1) * (y2 - y1)
                    if area > max_area:
                        max_area = area
                        best_box = (x1, y1, x2, y2)
        if best_box:
            return image.crop(best_box)
        return image
    except:
        return image

# --- 4. MAIN EVALUATION ---
def run_evaluation():
    print(f"--- ĐÁNH GIÁ DINOv2 TRÊN '{TEST_DIR}' ---")
    
    if not os.path.exists(INDEX_FILE):
        print("Chưa thấy file Index V2!")
        return

    index = faiss.read_index(INDEX_FILE)
    df = pd.read_csv(METADATA_FILE)
    model = CarEmbedder().to(DEVICE)
    model.eval()
    
    stats = []
    total_processed = 0
    total_top1_correct = 0
    total_top5_matches = 0

    downloaded_brands = [d for d in os.listdir(TEST_DIR) if os.path.isdir(os.path.join(TEST_DIR, d))]

    for folder_name in downloaded_brands:
        if folder_name not in BRAND_MAPPING: continue
            
        target_brand = BRAND_MAPPING[folder_name]
        folder_path = os.path.join(TEST_DIR, folder_name)
        image_files = [f for f in os.listdir(folder_path) if f.lower().endswith(('jpg', 'jpeg', 'png'))]
        
        if not image_files: continue

        print(f"Testing {target_brand}...", end="")
        
        brand_correct = 0
        brand_top5 = 0
        valid_cnt = 0
        
        for img_file in tqdm(image_files, leave=False):
            try:
                img_path = os.path.join(folder_path, img_file)
                img = Image.open(img_path).convert('RGB')
                img = smart_crop(img) # Crop
                
                input_tensor = transform_pipeline(img).unsqueeze(0).to(DEVICE)
                
                with torch.no_grad():
                    # Embed & Fix Contiguous array for FAISS
                    vec = model(input_tensor).cpu().numpy()
                    vec = np.ascontiguousarray(vec, dtype=np.float32)
                    faiss.normalize_L2(vec)
                
                D, I = index.search(vec, 5)
                
                valid_cnt += 1
                
                # Top 1 Check
                if I[0][0] < len(df) and df.iloc[I[0][0]]['brand'] == target_brand:
                    brand_correct += 1
                
                # Top 5 Check
                matches = 0
                for idx in I[0]:
                    if idx < len(df) and df.iloc[idx]['brand'] == target_brand:
                        matches += 1
                brand_top5 += matches

            except: pass
        
        if valid_cnt > 0:
            acc = (brand_correct / valid_cnt) * 100
            const = (brand_top5 / (valid_cnt * 5)) * 100
            stats.append([target_brand, valid_cnt, f"{acc:.1f}%", f"{const:.1f}%"])
            total_processed += valid_cnt
            total_top1_correct += brand_correct
            total_top5_matches += brand_top5
            print(f" -> Acc: {acc:.1f}%")

    print("\n" + "="*60)
    print("KẾT QUẢ CUỐI CÙNG (DINOv2 + PADDING)")
    print("="*60)
    print(tabulate(stats, headers=["Hãng", "Số ảnh", "Top 1 Accuracy", "Top 5 Consistency"], tablefmt="grid"))
    
    if total_processed > 0:
        final_acc = (total_top1_correct / total_processed) * 100
        final_const = (total_top5_matches / (total_processed * 5)) * 100
        print(f"\nTOP 1 TRUNG BÌNH: {final_acc:.2f}% (Cũ: 26.87%)")
        print(f"TOP 5 TRUNG BÌNH: {final_const:.2f}% (Cũ: 23.88%)")

if __name__ == "__main__":
    run_evaluation()