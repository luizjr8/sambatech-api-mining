from flask import Flask, request
import numpy as np
from keras.models import Model
from keras.layers import Dense, Dropout
from keras.applications.mobilenet import MobileNet
from keras.applications.mobilenet import preprocess_input
from keras.utils import load_img, img_to_array
import tensorflow as tf

nima_model = None
nima_aesthetic = None
nima_technical = None

with tf.device('/CPU:0'):
	base_model = MobileNet((None, None, 3), alpha=1, include_top=False, pooling='avg', weights=None)

	nima_model = Model(base_model.input, Dense(10, activation='softmax')(Dropout(0.75)(base_model.output)))
	nima_model.load_weights('weights/mobilenet_weights.h5')
	nima_aesthetic = Model(base_model.input, Dense(10, activation='softmax')(Dropout(0.75)(base_model.output)))
	nima_aesthetic.load_weights('weights/weights_mobilenet_aesthetic_0.07.hdf5')
	nima_technical = Model(base_model.input, Dense(10, activation='softmax')(Dropout(0.75)(base_model.output)))
	nima_technical.load_weights('weights/weights_mobilenet_technical_0.11.hdf5')

# Inicializa
app = Flask(__name__)

# calculate mean score for AVA dataset
def mean_score(scores):
    si = np.arange(1, 11, 1)
    mean = np.sum(scores * si)
    return mean

# calculate standard deviation of scores for AVA dataset
def std_score(scores):
    si = np.arange(1, 11, 1)
    mean = mean_score(scores)
    std = np.sqrt(np.sum(((si - mean) ** 2) * scores))
    return std

def decode_img(img):
  # Convert the compressed string to a 3D uint8 tensor
  img = tf.io.decode_jpeg(img, channels=3)
  # Resize the image to the desired size
  return tf.image.resize(img, [320, 320])

@app.route("/")
def index():
	file = request.args.get("file")
	img = load_img(f"img/{file}", target_size=None)
	x = img_to_array(img)
	x = np.expand_dims(x, axis=0)

	x = preprocess_input(x)

	scores = nima_model.predict(x, batch_size=1, verbose=0)[0]
	scores_aest = nima_aesthetic.predict(x, batch_size=1, verbose=0)[0]
	scores_tech = nima_technical.predict(x, batch_size=1, verbose=0)[0]

	total = mean_score(scores)*2 + mean_score(scores_aest)*2 + mean_score(scores_tech)

	# strReturn = "NIMA Score : %0.3f +- (%0.3f)" % (mean_score(scores), std_score(scores))
	# strReturn += "\r\nNIMA Aesthetic Score : %0.3f +- (%0.3f)" % (mean_score(scores_aest), std_score(scores_aest))
	# strReturn += "\r\nNIMA Technical Score : %0.3f +- (%0.3f)" % (mean_score(scores_tech), std_score(scores_tech))
	# strReturn += "\r\Total %s : %0.3f Méd: %0.3f " % (file, total, total / 3)

	objReturn = {
		"file": file,
		"aesthetic": mean_score(scores_aest),
		"technical": mean_score(scores_tech),
		"mobilenet": mean_score(scores),
		"total": total,
		"total_mean": total / 5
	}
	return objReturn

@app.route("/add", methods=["POST"])
def add():
    data = request.get_json()
    num1 = data["num1"]
    num2 = data["num2"]
    result = num1 + num2
    return {"result": result}

if __name__ == "__main__":
    app.run(port=2564)
