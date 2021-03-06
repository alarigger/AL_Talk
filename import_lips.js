// IMPORT LIPSING 

/*
    detect lipsing form audio sound in the audio folder scene 
    find the nearest "mouthy" node in the selected node's group 
    expose a selection corresponging subs according to the choosed emotion current angle and phonem 
    in order for the script to work the sub namespace shoud be as following : 
    [EMOTION]_[ANGLE]_[PHONEME] ("JOY_QF_A")
    will also detect angle of the head to call the correct subs . 

    the user can also provide text to improve the detection quality

    Alexandre Cormier 
    07/04/0222
*/


function import_lips(){

    //EXECUTION 
	scene.beginUndoRedoAccum("import_lips");
	InputDialog();
	scene.endUndoRedoAccum();

	function InputDialog (){

        //we search for a node with a "mouthy" name inside the selected node's group
        find_and_select_mouth_node()

        //simple UI with two inputs "EMOTION" and "EXPOSURE"
	    var d = new Dialog
	    d.title = "Import_lips";
	    d.width = 100;

        //EMOTION : the choosen emotion to find subs with this prefix
		var EmotionInput = new ComboBox();
        EmotionInput.label = "Emotion : ";
        EmotionInput.editable = true;
        EmotionInput.itemList = ["JOY","NEUTRE","SAD"];
		d.add( EmotionInput );

        //EXPOSURE : how often the sub will be updated we creating lisping animation
		var ExposureInput = new ComboBox();
        ExposureInput.label = "Expose at  : ";
        ExposureInput.editable = true;
        ExposureInput.itemList = [1,2,3,4];
		d.add( ExposureInput );

        //DIALOG : the written text of the sound to improve detection quality
        var dialogueInput = new LineEdit();
        dialogueInput.text = get_scene_dialog_file_content()
        dialogueInput.label = "Dial : ";
        d.add(dialogueInput);
		if ( d.exec() ){	
            var args = {
                "emotion":EmotionInput.currentItem,
                "exposure":ExposureInput.currentItem,
                "dialog":dialogueInput.text
            }
            apply_lipsing(args)
		}
		
	}


    function apply_lipsing(_args){

        var DETECTION = load_or_generate_detection(_args.dialog)
        var PHONEME = "REST"
        var ANGLE = "F"

        //we apply the phonem from the current frame to the end of the detection dict 
        for (var f = frame.current() ; f <Object.keys(DETECTION).length;f++){
            clear_exposure(f)
            if (f % _args.exposure==0){
                PHONEME = DETECTION[f]
                ANGLE = get_current_head_angle(f)
            }
            var sub_name = [ANGLE,_args.emotion,PHONEME].join("_")
            MessageLog.trace(sub_name)
            expose_sub(f,sub_name)
        }
    }


    function get_current_head_angle(_frame){
        //search inside the selected node's group for a node with a "heady" name and read its current displayed sub name
        var node_path = selection.selectedNode(0)
        
        split_slash  = node_path.split("/")
        last = split_slash[split_slash.length-1]
        parent_group_path = node_path.split(last)[0]
        var head_names = ["HEAD","head"];
        for (var i in head_names){
            var possible_node_path = parent_group_path+head_names[i]
            current_drawing = node.getTextAttr(possible_node_path, _frame,"DRAWING");
            if(current_drawing!=""){
                var drawing_angle = extract_angle_from_drawing_path(current_drawing)
                if(drawing_angle!=""){
                    return drawing_angle
                }
            }
        }
        var default_angle = "QF"
        return default_angle
    }


    function  find_and_select_mouth_node(){
        var node_path = selection.selectedNode(0)
        split_slash  = node_path.split("/")
        last = split_slash[split_slash.length-1]
        parent_group_path = node_path.split(last)[0]
        var mouth_names = ["mouth","MOUTH","BOUCHE"];
        for (var i in mouth_names){
            var possible_node_path = parent_group_path+mouth_names[i]
            current_drawing = node.getTextAttr(possible_node_path, frame.current(),"DRAWING");
            if(current_drawing!=""){
                selection.clearSelection()
                selection.addNodeToSelection(possible_node_path)
            }
        }
    }

    function extract_angle_from_drawing_path(_path){
        //the sub name patern should looks like so :   "" HEAD-F_SAD  ""    for the angle to be read. 
        //Path sample : elements/HEAD/HEAD-F_SAD.tvg
        var split_slash = _path.split("/")
        var last = split_slash[split_slash.length-1]
        var split_six = last.split("-")
        var last = split_six[split_six.length-1]
        var split_angle = last.split("_")[0]
        return split_angle
    }

    function get_scene_audio_file(){
        var dir = new Dir;
        audio_folder_path = scene.currentProjectPathRemapped()+"/audio"
        dir.path = audio_folder_path
        files = dir.entryList("*")
        var sound_formats = ["wav","mp3"]
        //we loop throught the audio folder and take the first sound
        //in a normal animation scene there should be only one file. 
        for (f in files){
            if(sound_formats.indexOf(files[f].split(".")[1])!=-1){
                var audio_file_path = audio_folder_path+"/"+files[f]
                MessageLog.trace("found "+audio_file_path)
                return audio_file_path
            }
        }
    }

    function load_or_generate_detection(_text){

        var scene_audio = get_scene_audio_file()
        

        //the detec json is the audio file with -detec :  audio.wav = audio_detect.json
        detect_file_path = scene_audio.split(".wav").join("_detec.json")
        var file = new File( detect_file_path );

        var last_dialog = get_scene_dialog_file_content()

        //if there is no detec file  or the dialog has been modified
        if(!file.exists || last_dialog!=_text ){

            var dialog_path = format_dialog_file_path_from_audio(scene_audio)
            //we remove and create a new dialog_txt 
            delete_dialog_file(dialog_path)
            create_dialog_file(_text,dialog_path)

            //we generate detection with a python code using rhubarb
            var TALK_PYTHON_PATH = "D:/1_TRAVAIL/WIP/ALARIGGER/CODING/JS/REPOSITORIES/AL_Talk/talk.py"
            p1 = new Process2( "python",TALK_PYTHON_PATH,"-s",scene_audio,"-d",dialog_path);
            p1.launch();           
        }
        if(file.exists){
            file.open(1)
            var content = file.read()
            file.close()
            var data = JSON.parse(content)
            return data["conformed"]
        }
        return "problem while generating detection"
    }

    function format_dialog_file_path_from_audio(_audio_file){
        return _audio_file.split(".wav").join("_dialog.txt")
    }

    function delete_dialog_file(_text,_path){
        var file = new File(_path);
        file.remove()
    }

    function create_dialog_file(_text,_audio_file){
        var file = new File(_path);
        file.open(4)
        var content = file.write(_text)
        return dialog_file_path

        /*
        hey merci pour les cadeaux les nullos ha ha
        */
    }

    function get_scene_dialog_file_content(){
        var dir = new Dir;
        audio_folder_path = scene.currentProjectPathRemapped()+"/audio"
        dir.path = audio_folder_path
        files = dir.entryList("*")
        for (f in files){
            if(files[f].split(".")[1]=="txt"){
                var dialog_file_path = audio_folder_path+"/"+files[f]
                MessageLog.trace("found "+dialog_file_path)
                var file = new File( dialog_file_path );
                file.open(1)           
                var content = file.read()  
                file.close()   
                return content
            }
        }
        return ""        
    }

    function clear_exposure(_frame){
        var numSelLayers = Timeline.numLayerSel;
        for ( var i = 0; i < numSelLayers; i++ ){
            if ( Timeline.selIsColumn(i)){
               var currentColumn = Timeline.selToColumn(i);
               if (column.type(currentColumn) == "DRAWING"){
                   var sub_timing = column.getDrawingTimings(currentColumn);
                   column.setEntry(currentColumn,1,_frame,"")
               }
            }
        }       
    }

    function expose_sub(_frame,_name){
        var numSelLayers = Timeline.numLayerSel;
        for ( var i = 0; i < numSelLayers; i++ ){
            if ( Timeline.selIsColumn(i)){
               var currentColumn = Timeline.selToColumn(i);
               if (column.type(currentColumn) == "DRAWING"){
                   var sub_timing = column.getDrawingTimings(currentColumn);
                   var sub_index = sub_timing.indexOf(_name)
                   if(sub_index!=-1){
                        column.setEntry(currentColumn,1,_frame,sub_timing[sub_index])
                    }else{
                        column.setEntry(currentColumn,1,_frame,sub_timing[0])
                    }
               }
            }
        }
    }
}