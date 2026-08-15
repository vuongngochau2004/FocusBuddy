import cv2
import numpy as np

def deskew_image(img: np.ndarray) -> np.ndarray:
    """
    Detects document tilt angle and rotates the image to align table grid lines horizontally.
    """
    if img is None or img.size == 0:
        return img

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) < 100:
        return img

    rect = cv2.minAreaRect(coords)
    angle = rect[-1]
    
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    # Only deskew if tilt angle is between 0.3 and 15 degrees
    if 0.3 < abs(angle) < 15:
        (h, w) = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
        )
        return rotated

    return img

def remove_watermark_and_binarize(img: np.ndarray) -> np.ndarray:
    """
    Removes faint background watermarks (e.g. stamps, SMAS.EDU.VN text, paper shadows)
    and converts image to crisp black text on white background using bilateral filtering & adaptive thresholding.
    """
    if img is None or img.size == 0:
        return img

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

    # Smooth out background watermark texture while preserving sharp printed text edges
    smoothed = cv2.bilateralFilter(gray, 5, 40, 40)

    # Adaptive thresholding to isolate sharp text and eliminate faint watermarks
    binary = cv2.adaptiveThreshold(
        smoothed, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 19, 9
    )

    return cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)

def normalize_colored_paper(img: np.ndarray) -> np.ndarray:
    """
    Removes colored paper background (e.g. green, yellow, pink transcripts) and uneven lighting/shadows
    using LAB color space morphological illumination normalization.
    """
    if img is None or img.size == 0:
        return img

    # Convert BGR to LAB color space
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_channel, _, _ = cv2.split(lab)

    # Estimate background illumination using large morphological closing
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
    background = cv2.morphologyEx(l_channel, cv2.MORPH_CLOSE, kernel)

    # Divide L channel by estimated background to flatten color tint and shadows
    normalized = cv2.divide(l_channel, background, scale=255)

    # Convert clean grayscale back to 3-channel BGR image
    return cv2.cvtColor(normalized, cv2.COLOR_GRAY2BGR)


def enhance_contrast(img: np.ndarray) -> np.ndarray:
    """
    Applies CLAHE to sharpen text after background color normalization.
    """
    if img is None or img.size == 0:
        return img

    is_bgr = len(img.shape) == 3
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if is_bgr else img

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_gray = clahe.apply(gray)

    if is_bgr:
        return cv2.cvtColor(enhanced_gray, cv2.COLOR_GRAY2BGR)
    return enhanced_gray


def preprocess_cell_crop(crop: np.ndarray, target_height: int = 64) -> np.ndarray:
    """
    Preprocesses individual table cell crops for VietOCR:
    - Upscales small cell images (height < 64px) using CUBIC interpolation.
    - Preserves clean original colors/grayscale without aggressive contrast distortion.
    """
    if crop is None or crop.size == 0:
        return crop

    h, w = crop.shape[:2]
    if h < 4 or w < 4:
        return crop

    # Upscale cell if height is small for better VietOCR recognition
    if h < target_height:
        scale = target_height / float(h)
        new_w = max(1, int(w * scale))
        crop = cv2.resize(crop, (new_w, target_height), interpolation=cv2.INTER_CUBIC)

    return crop

