
import os
import subprocess
import json
import sys, getopt

def generate_detection_file(input_sound_path,input_dialog_path):
    
    #formating rhubarb command line 
    RHUBARB = "D:/1_TRAVAIL/LIB/Rhubarb-Lip-Sync-1.12.0-Windows/rhubarb.exe"
    output_path = os.path.dirname(input_sound_path)+"/"+ os.path.basename(input_sound_path).split(".")[0]+"_detec.json"
    print(output_path)

    args = []
    args.append(RHUBARB)
    args.append("-o "+output_path)
    args.append(input_sound_path)
    #optionnal dialog txt option (the written text said, can improve the detection's quality)
    if input_dialog_path:
        args.append("-d "+input_dialog_path)
    args.append("-f json")
    #args.append("-r phonetic")
    args.append("--extendedShapes GHX")
    args.append("-q")

    subprocess.run(args)
    if os.path.exists(output_path):
        conform_detection(output_path)

def parse_phonem_map(_path):
    with open(_path, "r") as jsonFile:
        data = json.load(jsonFile)
        return data

            
def conform_detection(_file):

    #the phonem map is a correspondance table to convert rhubarb phonem (A,B,C,D) to more convinient one (BMP,AI,E,REST)
    phonem_map = parse_phonem_map("D:/1_TRAVAIL/WIP/ALARIGGER/CODING/JS/REPOSITORIES/AL_Talk/phoneme_map.json")

    with open(_file, "r") as jsonFile:
        data = json.load(jsonFile)
        frame_dict ={}
        for mouth_cue in data.get('mouthCues'):
            #conforming the phonemenes and creating a table with phonem per frame instead of range
            start_frame = round(float(mouth_cue.get("start"))*25)
            end_frame = round(float(mouth_cue.get("end"))*25)
            mapped_phoneme = ""
            if mouth_cue["value"] in phonem_map.keys():
                mapped_phoneme=phonem_map[mouth_cue["value"]]
            for f in range(start_frame,end_frame):
                frame_dict[str(f)]=mapped_phoneme
        data["conformed"]=frame_dict
        print(data)
    with open(_file, "w") as jsonFile:
        json.dump(data, jsonFile)

def main(argv):

    input_sound_path=None
    input_dialog_path=None

    try:
      opts, args = getopt.getopt(argv,"hs:d:",["input_sound_path=","input_dialog="])
    except getopt.GetoptError:
      print ('talk.py -s <input_sound_path> ')
      print ('input_sound_path can be a file or folder')
      print ('if folder given , it will be searched for a recent audio file')
      sys.exit(2)
    for opt, arg in opts:
      if opt == '-h':
        print ('talk.py -s <input_sound_path> ')
        print ('input_sound_path can be a file or folder')
        print ('if folder given , it will be searched for a audio file')
        sys.exit()
      elif opt in ("-s", "--input_sound_path"):
        if os.path.exists(arg):
            input_sound_path = arg
            #if the given path is a folder we search for an audio file in it
            if os.path.isdir(input_sound_path):
                print("folder given")
                for root, dirs, files in os.walk(input_sound_path):
                    for file in files:
                        if file.split(".")[-1] in ['wav','mp3']:
                            #we stop at the first one , there should be just one file anyway
                            input_sound_path = root+'/'+file
                            break
      elif opt in ("-d", "--input_dialog"):
        if os.path.exists(arg):
            input_dialog_path = arg
    print(input_sound_path) 
    if input_sound_path:
        generate_detection_file(input_sound_path,input_dialog_path)
    else:
        print("incorrect input sound ")

if __name__ == "__main__":
   main(sys.argv[1:])
'''
 python D:/1_TRAVAIL/WIP/ALARIGGER/CODING/JS/REPOSITORIES/AL_Talk/talk.py -s D:/1_TRAVAIL/WIP/LIPSING/test_material/Head/audio
'''