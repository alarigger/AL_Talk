function import_lips(){

    var DETECTION = load_or_generate_detection()
    var EMOTION = "JOY"
    var EXPOSURE = 2
    var PHONEME = "REST"
    var ANGLE = "F"


    for (var f = frame.current() ; f <frame.numberOf()+1;f++){
        if (f % EXPOSURE==0){
            PHONEME = DETECTION[f]
            ANGLE = get_current_head_angle(f)
        }
        var sub_name = ANGLE+"_"+ PHONEME
        expose_sub(f,sub_name)
    }

    function get_current_head_angle(_frame){
        //search inside the selected node's group for a node with a "heady" name and read its current displayed sub name
        
        var node_path = selection.selectedNode(0)
        split_slash  = node_path.split("/")
        parent_group_path = split_slash[split_slash.length-2]
        var head_names = ["HEAD","head"];
        for (var i in head_names){
            var possible_node_path = parent_group_path+"/"+head_names[i]
            current_drawing = node.getTextAttr(possible_node_path, _frame, "DRAWING");
            if(current_drawing!="unknown"){
                return extract_angle_from_drawing_path(current_drawing)
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
        MessageLog.trace(split_angle)
        return split_angle
    }

    function get_scene_audio_file(){
        return scene.currentProjectPathRemapped()+"/audio/son.wav";
    }
    
    function load_or_generate_detection(){
        //the audio_path should follow a predictable patern
        var scene_audio = get_scene_audio_file()
        //the detec json is the audio file with -detec :  audio.wav = audio_detect.json
        detect_file_path = scene_audio.split(".wav").join("_detec.json")
        var file = new File( detect_file_path );
        if(!file.exists){
            //we generate it with a python code using rhubarb
            var TALK_PYTHON_PATH = "D:/1_TRAVAIL/WIP/ALARIGGER/CODING/JS/REPOSITORIES/AL_Talk/talk.py"
            args = ["python",TALK_PYTHON_PATH,"-s",scene_audio]
            args.join(" ")
            MessageLog.trace(args.join(" "))
            p1 = new Process2( "python",TALK_PYTHON_PATH,"-s",scene_audio );
            p1.launch();           
        }
        if(file.exists){
            file.open(1)
            var content = file.read()
            var data = JSON.parse(content)
            return data["conformed"]
        }
        return "problem while generating detection"
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