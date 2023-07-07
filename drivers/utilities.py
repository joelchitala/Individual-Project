
import os

def check_bool(data):
    if type(data) == str:
        data = data.lower().strip()
        if data == "false":
            return False
        elif data == "true":
            return True
    elif type(data) == int or type(data) == float:
        if data == 0:
            return False
        elif data == 1:
            return True
    else:
        return data

def delete_file(file_path):
    if file_path.strip() == "":
        return False
    try:
        os.remove(file_path)
        print(f"File {file_path} deleted successfully.")
        return True
    except FileNotFoundError:
        print(f"File {file_path} does not exist.")
    except PermissionError:
        print(f"Permission denied to delete file {file_path}.")
    except Exception as e:
        print(f"An error occurred while deleting file {file_path}: {str(e)}")

    return False

def createFile(filepath:str,data):
    try:
        f = None
        with open(filepath,"w+") as file:
            file.write(data)
        return True
    except:
        print(f"Failed to create {filepath}")
    return False

def lowercase_dict_keys(dictionary):
    lowercase_dict = {}
    for key, value in dictionary.items():
        lowercase_key = key.lower()
        lowercase_dict[lowercase_key] = value
    return lowercase_dict
