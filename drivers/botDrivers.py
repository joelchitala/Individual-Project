import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Flatten, LSTM
from nltk.stem import WordNetLemmatizer
import nltk
import json
import pickle
import random
from keras.models import load_model

nltk.download('punkt')
nltk.download('wordnet')

def preprocessText(text=""):
    text = text.strip()
    return text.lower()

class Bots:
    def __init__(self):
        self.bots = []
        
    def add_bot(self, bot):
        valid = True
        for item in self.bots:
            if item.getName() == bot.getName() or item.getId() == bot.getId():
                return
        self.bots.append(bot)
    
    def get_bot(self, id):
        valid = True
        for item in self.bots:
            if item.getId() == id:
                return item
    def remove_bot(self, _id: int):
        for item in self.bots:
            if item.getId() == _id:
                self.bots.remove(item)
                break

    def predict(self, _id:int, text:str):
        for bot in self.bots:
            if bot.getId() == _id:
                return bot.predict(text)
        return False

    def exists(self,_id:int):
        for bot in self.bots:
            if bot.getId() == _id:
                return True
        return False

class Bot:
    def __init__(self, _id, name, model_url, content_url, words_url, classes_url):
        self.repo = None
        self.initiated_time = None
        self._id:int = _id
        self.name:str = name
        self.model_url = model_url
        self.content_url = content_url
        self.model = self.setModel(model_url)
        self.content = self.setContent(content_url)

        self.lemmatizer = WordNetLemmatizer()
        self.intents = json.loads(open(content_url).read())
        self.words = pickle.load(open(words_url, 'rb'))
        self.classes = pickle.load(open(classes_url, 'rb'))

    def setRepo(self,repository):
        self.repo = repository

    def getId(self):
        return self._id

    def getName(self):
        return self.name

    def getUrl(self):
        return self.model_url

    def setModel(self, url):
        try:
            return load_model(url)
        except:
            print(f"Error fetching model {url}")
        return None

    def setContent(self, url):
        try:
            with open(url) as content:
                return json.load(content)
        except:
            print(f"Error fetching content {url}")
        return None

    def predict(self, text):
        def clean_sentences(text):
            sentence_words = nltk.word_tokenize(text)
            sentence_words = [self.lemmatizer.lemmatize(word) for word in sentence_words]
            return sentence_words

        def bag_of_words(text):
            words = clean_sentences(text)
            bag = [0] * len(self.words)
            for w in words:
                for i, word in enumerate(self.words):
                    if word == w:
                        bag[i] = 1
            return np.array([bag]).reshape(1,1, len(self.words)) 

        def prediction(text):
            bow = bag_of_words(text)
            res = self.model.predict(bow)[0]
            ERROR_THRESHOLD = 0.2
            results = [[i, r] for i, r in enumerate(res) if r > ERROR_THRESHOLD]
            results.sort(key=lambda x: x[1], reverse=True)
            return_list = []
            for r in results:
                return_list.append({'intent': self.classes[r[0]], 'probability': str(r[1])})
            return return_list

        def get_response(intents_list, intents_json):
            if not intents_list:
                return "Sorry, I didn't understand that."
            tag = intents_list[0]['intent']
            list_of_intents = intents_json['intents']
            result = ""
            for i in list_of_intents:
                if i['intent'] == tag:
                    result = random.choice(i['responses'])
                    break
            return tag, result

        tag, res = get_response(prediction(text), self.intents)

        return {"intent": tag, "responses": [res]}

def trainBot(filePath:str,contentPath:str,paths:dict):
    try:
        lemmatizer = WordNetLemmatizer()

        intents = json.loads(open(contentPath).read())

        words = []
        classes = []
        documents = []
        ignore_letters = ["?", "!", ".", ","]

        for intent in intents['intents']:
            for _input in intent['inputs']:
                word_list = nltk.word_tokenize(_input)
                words.extend(word_list)

                documents.append(((word_list), intent['intent']))

                if intent['intent'] not in classes:
                    classes.append(intent['intent'])

        words = [lemmatizer.lemmatize(word) for word in words if word not in ignore_letters]
        words = sorted(set(words))

        pickle.dump(words, open(paths["words"], 'wb'))
        pickle.dump(classes, open(paths["classes"], 'wb'))

        training = []
        output_empty = [0]*len(classes)

        for document in documents:
            bag = []
            word_patterns = document[0]
            word_patterns = [lemmatizer.lemmatize(word.lower()) for word in word_patterns]
            for word in words:
                bag.append(1) if word in word_patterns else bag.append(0)

            output_row = list(output_empty)
            output_row[classes.index(document[1])] = 1
            training.append([bag, output_row])

        random.shuffle(training)
        training = np.array(training)

        train_x = list(training[:, 0])
        train_y = list(training[:, 1])

        train_x = np.array(train_x)
        train_x = train_x.reshape((train_x.shape[0], 1, train_x.shape[1]))

        model = Sequential()
        model.add(LSTM(128, input_shape=(1,len(train_x[0][0])), activation='relu'))
        model.add(Flatten())
        model.add(Dense(64, activation='relu'))
        model.add(Dropout(0.5))
        model.add(Dense(len(train_y[0]), activation='softmax'))

        model.compile(loss='categorical_crossentropy', optimizer="adam", metrics=['accuracy'])
        
        trained_model = model.fit(train_x, np.array(train_y), epochs=200, batch_size=5, verbose=1)
        model.save(filePath, trained_model)

        return True
    except Exception as e:
        print(e)
        return False


