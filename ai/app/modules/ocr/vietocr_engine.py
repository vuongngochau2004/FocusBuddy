import logging
import numpy as np
from PIL import Image
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("focusbuddy.ai.ocr.vietocr")

class VietOCREngine:
    """
    Wrapper for VietOCR (VGG-Transformer model) specialized in Vietnamese text recognition.
    """
    def __init__(self, model_name: Optional[str] = None, device: Optional[str] = None):
        self.model_name = model_name or getattr(settings, "VIETOCR_MODEL_NAME", "vgg_transformer")
        self.device = device or getattr(settings, "VIETOCR_DEVICE", "cpu")
        self._detector = None

    def _get_detector(self):
        if self._detector is None:
            try:
                from vietocr.tool.config import Cfg
                from vietocr.tool.predictor import Predictor
                
                logger.info(f"Initializing VietOCR Predictor (model='{self.model_name}', device='{self.device}')...")
                config = Cfg.load_config_from_name(self.model_name)
                config['device'] = self.device
                config['predictor']['beamsearch'] = False
                
                self._detector = Predictor(config)
                logger.info("VietOCR Predictor initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize VietOCR Predictor: {e}")
                raise e
        return self._detector

    def predict_cell_text(self, crop_np: np.ndarray) -> str:
        """
        Accepts a numpy BGR crop image, converts to PIL Image (RGB),
        runs VietOCR prediction, and returns extracted text.
        """
        if crop_np is None or crop_np.size == 0:
            return ""

        h, w = crop_np.shape[:2]
        if h < 4 or w < 4:
            return ""

        try:
            detector = self._get_detector()
            
            # Convert OpenCV BGR array to PIL Image (RGB)
            if len(crop_np.shape) == 3 and crop_np.shape[2] == 3:
                rgb_arr = crop_np[:, :, ::-1] # BGR to RGB
            else:
                rgb_arr = crop_np
                
            pil_img = Image.fromarray(rgb_arr)
            text = detector.predict(pil_img)
            return text.strip() if text else ""
        except Exception as e:
            logger.warning(f"VietOCR prediction error: {e}")
            return ""

# Global VietOCR engine instance
vietocr_engine = VietOCREngine()
