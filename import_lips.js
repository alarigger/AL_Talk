function import_lips(){

    var DETECTION = load_detection()
    var EMOTION = "JOY"
    var EXPOSURE = 2
    var PHONEME = "REST"
    var ANGLE = "F"

    for (var f = frame.current() ; f <frame.numberOf()+1;f++){

        if (f % EXPOSURE==0){
            PHONEME = DETECTION[f]
            ANGLE = get_current_angle()
        }
        var sub_name = ANGLE+"_"+ PHONEME
        expose_sub(f,sub_name)
    }

    function get_current_angle(){
        return "F"
    }
    
    function load_detection(){
        detect_file_path = scene.currentProjectPathRemapped()+"\\audio\\son_detec.json";
        var file = new File( detect_file_path );
        if(file.exists){
            file.open(1)
            var content = file.read()
            var data = JSON.parse(content)
            return data["conformed"]
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