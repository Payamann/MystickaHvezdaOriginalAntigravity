
import os
from PIL import Image

def optimize_image(input_path, output_hd_path, output_mobile_path):
    try:
        if not os.path.exists(input_path):
            print(f"Error: Input file not found at {input_path}")
            return

        with Image.open(input_path) as img:
            print(f"Original image size: {img.size}")
            
            # 1. Web Version (HD)
            # Resize if wider than 2560px
            hd_width = 2560
            if img.width > hd_width:
                ratio = hd_width / img.width
                hd_height = int(img.height * ratio)
                img_hd = img.resize((hd_width, hd_height), Image.Resampling.LANCZOS)
            else:
                img_hd = img.copy()
            
            print(f"Saving HD version to {output_hd_path}...")
            img_hd.save(output_hd_path, "WEBP", quality=90, method=6)
            print(f"HD version saved. Size: {os.path.getsize(output_hd_path)}")

            # 2. Mobile Version (Portrait)
            # Target width 1080px (for high density phones)
            mobile_width = 1080
            # Target aspect ratio approx 9:16 (height ~1920)
            target_ratio = 9/16
            
            # Calculate crop box for center crop
            current_ratio = img.width / img.height
            if current_ratio > target_ratio:
                # Image is wider than target ratio, crop width
                new_width = int(img.height * target_ratio)
                left = (img.width - new_width) // 2
                top = 0
                right = left + new_width
                bottom = img.height
            else:
                # Image is taller than target ratio, crop height
                new_height = int(img.width / target_ratio)
                top = (img.height - new_height) // 2
                left = 0
                bottom = top + new_height
                right = img.width
            
            img_crop = img.crop((left, top, right, bottom))
            
            # Resize to mobile width
            ratio_mobile = mobile_width / img_crop.width
            mobile_height_final = int(img_crop.height * ratio_mobile)
            img_mobile = img_crop.resize((mobile_width, mobile_height_final), Image.Resampling.LANCZOS)
            
            print(f"Saving Mobile version to {output_mobile_path}...")
            img_mobile.save(output_mobile_path, "WEBP", quality=85, method=6)
            print(f"Mobile version saved. Size: {os.path.getsize(output_mobile_path)}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    base_dir = r"c:\Users\pavel\OneDrive\Desktop\MystickaHvezda"
    input_file = os.path.join(base_dir, "img", "bg-cosmic-hd.png")
    output_hd = os.path.join(base_dir, "img", "bg-cosmic-hd.webp")
    output_mobile = os.path.join(base_dir, "img", "bg-cosmic-mobile.webp")
    
    optimize_image(input_file, output_hd, output_mobile)
