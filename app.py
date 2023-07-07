import json
import random
from functools import wraps
import sqlite3
from flask import Flask, request, render_template, session, redirect, url_for
from flask_cors import CORS
from drivers.botDrivers import Bot, Bots, trainBot
from drivers.dbDrivers import TableCollection, CreateCollection
from drivers.utilities import createFile, delete_file, check_bool
from pymongo import MongoClient
import datetime

app = Flask(__name__, template_folder='templates', static_folder='static')

app.secret_key = 'your_secret_key'

CORS(app)

MONGODB_URI = 'mongodb://localhost:27017'
MONGODB_DB = 'individual_project'
MONGODB_COLLECTION = 'conversations'

client = MongoClient(MONGODB_URI)
mongoDB = client[MONGODB_DB]
mongo_collection = mongoDB[MONGODB_COLLECTION]

DATABASE = "./contents/database/app.db"

bots = Bots()

def connectDB():
    return sqlite3.connect(DATABASE)


def dbCollection(f):
    @wraps(f)
    def decorated_function(*args,**kwargs):
        value = kwargs.get("collectionName")
        if value is not None:
            collect = TableCollection(connectDB,value)
            if collect.valid:
                request.collection = collect
            else:
                request.collection = False
        else:
            request.collection = False
        return f(*args,**kwargs)
    return decorated_function

def createFileDecorator(f):
    @wraps(f)
    def decorated_function(*args,**kwargs):
        res = request.get_json()
        files = res["files"]
        request.files_array = []

        for file in files:
            name = file["name"]
            if name.strip() == "":
                continue

            if file["folder"].lower() != "models":
                filepath = "./contents/" + file["folder"] + "/" + file["name"] + ".json"
                result = createFile(filepath,json.dumps(file["data"]))
                print(filepath)
                print(result)
                if result:
                    res["data"]["intents_url"] = filepath
                    request.files_array.append({"folder":file["folder"],"path":filepath})

        return f(*args,**kwargs)
    return decorated_function

def removeChatbot(f):
    @wraps(f)
    def decorated_function(*args,**kwargs):
        value = kwargs.get("collectionName")

        def delete_chatbot(chatbot_id):
            models = TableCollection(connectDB, "models")
            models_array = models.getMany({"chatbot_id": chatbot_id})

            for model in models_array:
                id = model["id"]
                models_url = model["models_url"]
                words_url = model["words_url"]
                classes_url = model["classes_url"]
                intents_url = model["intents_url"]

                delete_file(models_url)
                delete_file(words_url)
                delete_file(classes_url)
                delete_file(intents_url)

                models.deleteOne({"id":id})


        if value == "users":
            chatbots = TableCollection(connectDB, "chatbots")
            user_chatbots = chatbots.getMany({"user_id":request.get_json()["id"]})
            for chatbot in user_chatbots:
                delete_chatbot(chatbot["id"])
                chatbots.deleteOne({"id":chatbot["id"]})

        if value == "chatbots":
            delete_chatbot(request.get_json()["id"])

        if value == "models":
            models = TableCollection(connectDB, "models")
            model = models.getMany(request.get_json())

            if len(model) > 0:
                model = model[0]
                models_url = model["models_url"]
                words_url = model["words_url"]
                classes_url = model["classes_url"]
                intents_url = model["intents_url"]
                delete_file(models_url)
                delete_file(words_url)
                delete_file(classes_url)
                delete_file(intents_url)

        return f(*args,**kwargs)
    return decorated_function

def updateChatbot(f):
    @wraps(f)
    def decorated_function(*args,**kwargs):
        value = kwargs.get("collectionName")

        if value == "chatbots":
            req_json = request.get_json()

            chatbots = TableCollection(connectDB,"chatbots")
            chatbots_array = chatbots.getMany(req_json["query"])

            if len(chatbots_array) > 0:
                chatbot = chatbots_array[0]
                data = req_json["data"]

                if "model_id" in data:
                    if data["model_id"] != chatbot["model_id"]:
                        chatbot_id = chatbot["id"]
                        bots.remove_bot(chatbot_id)

        return f(*args,**kwargs)
    return decorated_function
            
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page'))
        user_id = session['user_id']
        users = TableCollection(connectDB,"users")

        user = users.getMany({"id":user_id})

        if len(user) == 0:
            session.clear()
            return redirect(url_for('login_page'))

        if not check_bool(user[0]["isadmin"]):
            return redirect(url_for('index'))

        return f(*args, **kwargs)
    return decorated_function

def user_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page'))
        user_id = session['user_id']
        users = TableCollection(connectDB,"users")
        user = users.getMany({"id":user_id})

        if len(user) == 0:
            session.clear()
            return redirect(url_for('login_page'))

        if check_bool(user[0]["isadmin"]):
            return redirect(url_for('admin_dashboard'))
        
        return f(*args, **kwargs)
    return decorated_function

@app.before_request
def initialize():
    CreateCollection(connectDB, "users", [
        'id INTEGER PRIMARY KEY AUTOINCREMENT',
        'firstname TEXT NOT NULL',
        'lastname TEXT',
        'email TEXT NOT NULL',
        'password TEXT',
        'created_at TEXT',
        'isadmin BOOLEAN',
        'verified BOOLEAN',
        'disabled BOOLEAN'
    ])

    CreateCollection(connectDB, "chatbots", [
        'id INTEGER PRIMARY KEY AUTOINCREMENT',
        'name TEXT NOT NULL',
        'description TEXT',
        'created_at TEXT NOT NULL',
        'disabled BOOLEAN',
        'model_id INTEGER',
        'user_id INTEGER',
        'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'
    ])

    CreateCollection(connectDB, "models", [
        'id INTEGER PRIMARY KEY AUTOINCREMENT',
        'name TEXT NOT NULL',
        'description TEXT',
        'created_at TEXT NOT NULL',
        'models_url TEXT',
        'words_url TEXT',
        'classes_url TEXT',
        'intents_url TEXT',
        'chatbot_id INTEGER',
        'FOREIGN KEY(chatbot_id) REFERENCES chatbots(chatbot_id) ON DELETE CASCADE'
    ])

@app.route('/collection/<string:collectionName>', methods=['GET'])
@dbCollection
def collection_route_getAll(collectionName):
    if request.collection:
        return {"msg":request.collection.getAll(),"mode":True}
    return {"msg":f'table {collectionName} - was not found',"mode":False}

@app.route('/collection/<string:collectionName>', methods=['POST'])
@dbCollection
def collection_route_insert(collectionName):
    if request.collection:
        return {"msg": request.collection.insertOne(request.get_json()), "mode": True}
    return {"msg":f'table {collectionName} - was not found',"mode":False}

@app.route('/collection/<string:collectionName>', methods=['PUT'])
@dbCollection
@updateChatbot
def collection_route_update(collectionName):
    if request.collection:
        req_json = request.get_json()
        return {"msg": request.collection.updateOne(req_json["query"],req_json["data"]), "mode": True}
    return {"msg":f'table {collectionName} - was not found',"mode":False}

@app.route('/collection/<string:collectionName>', methods=['DELETE'])
@dbCollection
@removeChatbot
def collection_route_delete(collectionName):
    if request.collection:
        return {"msg": request.collection.deleteOne(request.get_json()), "mode": True}
    return {"msg":f'table {collectionName} - was not found',"mode":False}

@app.route('/search/collection/<string:collectionName>', methods=['POST'])
@dbCollection
def collection_route_search(collectionName):
    if request.collection:
        return {"msg": request.collection.getMany(request.get_json()), "mode": True}
    return {"msg":f'table {collectionName} - was not found',"mode":False}

@app.route('/search-one/collection/<string:collectionName>', methods=['POST'])
@dbCollection
def collection_route_search_one(collectionName):
    if request.collection:
        res = request.collection.getMany(request.get_json())
        return {"msg": res, "mode": False if len(res) == 0 else True}
    return {"msg":f'table {collectionName} - was not found',"mode":False}

@app.route('/train-model/collection/<string:collectionName>', methods=['POST'])
@createFileDecorator
@dbCollection
def collection_route_train_model(collectionName):
    if request.collection:
        print(collectionName)
        files_array = request.files_array
        if len(request.files_array) == 0:
            return {"msg":f'Failed to add contents - was not found',"mode":False}
        file_res = files_array[0]
        valid = True
        models_filepath = None
        words_filepath = None
        classes_filepath = None
        if file_res["folder"].lower() == "intents":
            res = request.get_json()
            files = res["files"]
            for file in files:
                name = file["name"]
                if name.strip() == "":
                    continue
                if file["folder"].lower() == "models":
                    filePath = "contents/" + file["folder"] + "/" + name + ".h5"
                    models_filepath = filePath
                    words_filepath = f"contents/words/{name}-words.pkl"
                    classes_filepath = f"contents/classes/{name}-classes.pkl"
                    valid = trainBot(filePath,file_res["path"],
                    {"words":words_filepath,"classes":classes_filepath})
                
        if not valid:
            for file in files_array:
                delete_file(file["path"])
            return {"msg":f'Failed to train the model',"mode":False}
        else:
            data = request.get_json()["data"]
            data["models_url"] = models_filepath
            data["words_url"] = words_filepath
            data["classes_url"] = classes_filepath
            data["intents_url"] = file_res["path"]

            result = request.collection.insertOne(data)
            if not result:
                delete_file(models_filepath)
                delete_file(words_filepath)
                delete_file(classes_filepath)
                for file in files_array:
                    delete_file(file["path"])

                return {"msg": f'Failed to add the model to database', "mode": False}

            return {"msg": result, "mode": True}

    return {"msg":f'table {collectionName} - was not found',"mode":False}

def save_chat_to_mongodb(user_text, chatbot_response,chatbot,mode=True,err_msg=None):
    chat_data = {
        'user_text': user_text,
        'chatbot_text': chatbot_response,
        'chatbot': chatbot,
        'timestamp': datetime.datetime.now(),
        'mode': mode,
        'err_msg': err_msg
    }
    mongo_collection.insert_one(chat_data)

@app.route("/webhook/<string:collectionName>",methods=["POST"])
@dbCollection
def webhook(collectionName):
    if request.collection:
        id = request.get_json()["id"]
        text = request.get_json()["text"]

        chatbot = request.collection.getMany({"id":id})

        models_collection = TableCollection(connectDB,"models")

        if len(chatbot) == 0:
            save_chat_to_mongodb(text, "",mode=False,err_msg="chatbot not found")
            return {"msg":f'chatbot not found',"mode":False}

        chatbot = chatbot[0]

        if not bots.exists(chatbot["id"]):
            model = models_collection.getMany({"id":chatbot["model_id"]})
            if len(model) == 0:
                return {"msg":f'model not set - was not found',"mode":False}
            model = model[0]
            bot = Bot(chatbot["id"],chatbot["name"],model["models_url"],model["intents_url"],model["words_url"],model["classes_url"])

            bots.add_bot(bot)
            prediction = random.choice(bot.predict(text)["responses"])
            save_chat_to_mongodb(text, prediction,chatbot)
            return {"msg": prediction, "mode": True}
        else:
            prediction = random.choice(bots.predict(id,text)["responses"])
            save_chat_to_mongodb(text, prediction,chatbot)
            return {"msg": prediction, "mode": True}

    save_chat_to_mongodb("", "",None,mode=False,err_msg=f"table {collectionName} - was not found")
    return {"msg":f'table {collectionName} - was not found',"mode":False}

@app.route("/",methods=["GET"])
def index():
    if 'user_id' in session:
        user = TableCollection(connectDB,"users").getMany({"id":session['user_id']})
        if len(user) > 0:
            session['isadmin'] = user[0]["isadmin"]
            return render_template("index.html",session=session)

    return render_template('index.html',session=None)

@app.route("/admin-dashboard",methods=["GET"])
@admin_required
def admin_dashboard():
    return render_template('/dashboard/admin/admin.html')

@app.route("/user-dashboard",methods=["GET"])
@user_required
def user_dashboard():
    return render_template('/dashboard/user/user.html')

@app.route("/login",methods=["POST"])
def login():
    users = TableCollection(connectDB,"users")
    try:
        request.get_json()["email"]
        request.get_json()["password"]
    except:
        return {"msg":f'email and password field is required',"mode":false}

    user = users.getMany(request.get_json())
    
    if user is None:
        return {"msg":f'user not found',"mode":False}

    if len(user) == 0:
        return {"msg":f'No user with creditionals found',"mode":False}
    else:
        session['user_id'] = user[0]["id"]

        if check_bool(user[0]["isadmin"]):
            return {"msg":"admin","mode":True,"redirect":"./admin-dashboard"}
        else:
            return {"msg":"user","mode":True,"redirect":"./user-dashboard"}

        return {"msg":f'Successfully logged in',"mode":True}

    return {"msg":f'failed to log in',"mode":False}

@app.route("/register",methods=["POST"])
def register():
    users = TableCollection(connectDB,"users")

    res_json = request.get_json()
    try:
        res_json["firstname"]
        res_json["email"]
        res_json["password"]
    except:
        return {"msg":f'firstName, email and password field is required',"mode":false}

    res_json["isadmin"] = False
    res_json["verified"] = True
    res_json["disabled"] = False

    try:
        TableCollection(connectDB,"users").insertOne(res_json)
        return {"msg":f'Successfully registered in',"mode":True,"redirect":"/login-page"}
    except:
        return {"msg":f'Registration failed in',"mode":False}

    return {"msg":f'failed to log in',"mode":False}

@app.route("/logout",methods=["GET"])
def logout():
    if 'user_id' in session:
        session.clear()
        return render_template('index.html')

    return {"msg":"user not logged out","mode":False}

@app.route("/login-page",methods=["GET"])
def login_page():
    return render_template('/auth/login.html')

@app.route("/register-page",methods=["GET"])
def register_page():
    return render_template('/auth/register.html')

@app.route("/session-id",methods=["GET"])
def get_session():
    if 'user_id' in session:
        return {"msg":TableCollection(connectDB,"users").getMany({"id":int(session["user_id"])}),"mode":True}

    return {"msg":"user not logged in","mode":False}
