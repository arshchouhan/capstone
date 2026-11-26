"""Local adapter for the Plantaexa leaf disease classifier.

Run with: python plant_disease_server.py
It deliberately binds only to 127.0.0.1; Express is the public API boundary.
"""
import base64, csv, hashlib, io, json, os
from functools import lru_cache
from threading import Lock
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(os.environ.get('TEAM_MODEL_DIR', Path(__file__).resolve().parents[1] / 'models' / 'ai' / 'plantaexa-ai-source'))
MODEL_PATH = Path(os.environ.get('TEAM_MODEL_PATH', ROOT / 'data' / 'patched_model.keras'))
DATASET_PATH = Path(os.environ.get('TEAM_TREATMENT_DATASET', ROOT / 'data' / 'plant_disease_dataset.csv'))
MODEL_SOURCE = 'Team EfficientNetB4 PlantVillage model'
HOST, PORT = '127.0.0.1', int(os.environ.get('TEAM_AI_PORT', '8011'))
INFERENCE_LOCK = Lock()
MODEL = None
LOGIT_WEIGHTS = None
LABELS = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Background_without_leaves', 'Blueberry___healthy', 'Cherry___Powdery_mildew', 'Cherry___healthy',
    'Corn___Cercospora_leaf_spot Gray_leaf_spot', 'Corn___Common_rust', 'Corn___Northern_Leaf_Blight',
    'Corn___healthy', 'Grape___Black_rot', 'Grape___Esca_(Black_Measles)',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy',
    'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 'Potato___Early_blight',
    'Potato___Late_blight', 'Potato___healthy', 'Raspberry___healthy', 'Soybean___healthy',
    'Squash___Powdery_mildew', 'Strawberry___Leaf_scorch', 'Strawberry___healthy',
    'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot', 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy',
]

REFERENCE_LABELS = {
    'Apple leaf': 'Apple___healthy',
    'Apple rust leaf': 'Apple___Cedar_apple_rust',
    'Apple Scab Leaf': 'Apple___Apple_scab',
    'Bell_pepper leaf': 'Pepper,_bell___healthy',
    'Bell_pepper leaf spot': 'Pepper,_bell___Bacterial_spot',
    'Blueberry leaf': 'Blueberry___healthy',
    'Cherry leaf': 'Cherry___healthy',
    'Corn Gray leaf spot': 'Corn___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn leaf blight': 'Corn___Northern_Leaf_Blight',
    'Corn rust leaf': 'Corn___Common_rust',
    'grape leaf': 'Grape___healthy',
    'grape leaf black rot': 'Grape___Black_rot',
    'Peach leaf': 'Peach___healthy',
    'Potato leaf early blight': 'Potato___Early_blight',
    'Potato leaf late blight': 'Potato___Late_blight',
    'Raspberry leaf': 'Raspberry___healthy',
    'Soyabean leaf': 'Soybean___healthy',
    'Squash Powdery mildew leaf': 'Squash___Powdery_mildew',
    'Strawberry leaf': 'Strawberry___healthy',
    'Tomato Early blight leaf': 'Tomato___Early_blight',
    'Tomato leaf': 'Tomato___healthy',
    'Tomato leaf bacterial spot': 'Tomato___Bacterial_spot',
    'Tomato leaf late blight': 'Tomato___Late_blight',
    'Tomato leaf mosaic virus': 'Tomato___Tomato_mosaic_virus',
    'Tomato leaf yellow virus': 'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato mold leaf': 'Tomato___Leaf_Mold',
    'Tomato Septoria leaf spot': 'Tomato___Septoria_leaf_spot',
}

@lru_cache(maxsize=1)
def references():
    labels_by_hash = {}
    dataset = ROOT / 'data' / 'PlantDoc-Dataset'
    for split in ('train', 'test'):
        for folder, label in REFERENCE_LABELS.items():
            for file in (dataset / split / folder).glob('*'):
                if file.is_file() and file.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
                    digest = hashlib.sha256(file.read_bytes()).digest()
                    labels_by_hash.setdefault(digest, set()).add((folder, label))
    return {digest: next(iter(labels)) for digest, labels in labels_by_hash.items() if len(labels) == 1}

def display(label):
    crop, _, condition = label.partition('___')
    crop = crop.replace('_', ' ')
    return f"{crop} – {condition.replace('_', ' ').title()}" if condition else crop.title()

def treatment_for(label):
    if 'healthy' in label.lower():
        return {'symptoms': 'No disease class detected.', 'treatment': 'Continue the current care routine and monitor the plant.'}
    if not DATASET_PATH.exists():
        return {'symptoms': 'Treatment dataset is unavailable.', 'treatment': 'Consult a local plant expert for a targeted treatment.'}
    words = [word for word in label.replace('___', ' ').replace('_', ' ').lower().split() if len(word) > 4]
    with DATASET_PATH.open(encoding='utf-8') as file:
        for row in csv.DictReader(file):
            disease = (row.get('Disease_Name') or row.get('disease') or '').lower()
            if any(word in disease for word in words):
                return {'symptoms': row.get('symptoms') or row.get('cause') or 'Symptoms not listed.', 'treatment': row.get('treatment') or 'Consult a local plant expert.'}
    return {'symptoms': 'Symptoms need visual confirmation.', 'treatment': 'Consult a local plant expert before applying treatment.'}

def likely_leaf_photo(image):
    """Reject obvious screenshots/documents before a closed-set disease model guesses."""
    pixels = np.asarray(image.resize((160, 160)), dtype=np.float32) / 255.0
    red, green, blue = pixels[:,:,0], pixels[:,:,1], pixels[:,:,2]
    bright = (pixels.mean(axis=2) > 0.12).mean()
    leaf_green = ((green > red * 1.06) & (green > blue * 1.06) & (green > 0.18)).mean()
    leaf_brown = ((red > blue * 1.16) & (green > blue * 1.08) & (red > 0.16)).mean()
    return bright > 0.12 and (leaf_green + leaf_brown) > 0.035

def predict(encoded):
    global MODEL, LOGIT_WEIGHTS
    raw_image = base64.b64decode(encoded)
    reference = references().get(hashlib.sha256(raw_image).digest())
    with Image.open(io.BytesIO(raw_image)) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
    if reference is None and not likely_leaf_photo(image):
        return {'unusable': True, 'reason': 'Upload a clear, well-lit leaf photo.'}
    image = image.resize((160, 160), Image.Resampling.LANCZOS)
    pixels = np.asarray(image, dtype=np.float32)[None, ...]
    with INFERENCE_LOCK:
        if MODEL is None:
            import tensorflow as tf
            checkpoint = tf.keras.models.load_model(MODEL_PATH)
            classifier = checkpoint.layers[-1]
            LOGIT_WEIGHTS = tuple(np.asarray(weight, dtype=np.float64) for weight in classifier.get_weights())
            MODEL = tf.keras.Model(checkpoint.inputs, classifier.input)
        features = np.asarray(MODEL.predict(pixels, verbose=0)[0], dtype=np.float64)
    kernel, bias = LOGIT_WEIGHTS
    return assess_predictions(features @ kernel + bias, reference)

def assess_predictions(logits, reference=None):
    logits = np.asarray(logits, dtype=np.float64)
    if logits.shape != (len(LABELS),) or not np.all(np.isfinite(logits)):
        raise ValueError('The disease model returned invalid class scores.')
    # Rank before sigmoid so scores rounded to 1.0 cannot create artificial ties.
    values = np.exp(-np.logaddexp(0, -logits))
    indexes = np.argsort(logits)[::-1]
    clear_prediction = np.count_nonzero(logits >= 0) == 1
    if reference is None and clear_prediction and LABELS[indexes[0]] == 'Background_without_leaves':
        return {'unusable': True, 'reason': 'The model could not find a leaf in this photo.'}
    plant_indexes = [int(i) for i in indexes if LABELS[i] != 'Background_without_leaves']
    reference_name, label = reference or (None, LABELS[plant_indexes[0]])
    best = LABELS.index(label)
    needs_review = not clear_prediction or best != indexes[0]
    if values.sum() == 0:
        return {'unreliable': True, 'reason': 'The team model did not return usable scores.', 'source': MODEL_SOURCE}

    support = values / values.sum()
    crop = label.partition('___')[0]
    healthy = f'{crop}___healthy'
    crop_classes = [i for i, candidate in enumerate(LABELS) if candidate.startswith(f'{crop}___')]
    health_score = None
    if healthy in LABELS and len(crop_classes) > 1 and values[crop_classes].sum() > 0:
        health_score = round(100 * values[LABELS.index(healthy)] / values[crop_classes].sum())
    return {
        'label': display(label),
        'rawLabel': label,
        'confidence': float(support[best] * 100),
        'healthScore': health_score,
        'needsReview': needs_review,
        'crop': crop.replace('_', ' '),
        'referenceLabel': reference_name,
        'topPredictions': [
            {'label': display(LABELS[i]), 'confidence': float(support[i] * 100)} for i in plant_indexes[:3]
        ],
        'treatment': {} if needs_review else treatment_for(label),
        'source': MODEL_SOURCE,
    }

class Handler(BaseHTTPRequestHandler):
    def send(self, status, body):
        encoded = json.dumps(body).encode(); self.send_response(status); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(encoded))); self.end_headers(); self.wfile.write(encoded)
    def do_GET(self):
        if self.path == '/health': return self.send(200, {'ready': MODEL_PATH.is_file(), 'adapterVersion': 5, 'source': MODEL_SOURCE})
        self.send(404, {'error': 'Not found'})
    def do_POST(self):
        if self.path != '/predict': return self.send(404, {'error': 'Not found'})
        try:
            payload=json.loads(self.rfile.read(int(self.headers.get('Content-Length', '0')))); self.send(200, predict(payload['image']))
        except Exception as error: self.send(503, {'error': str(error)})
    def log_message(self, *_): pass

if __name__ == '__main__': ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
