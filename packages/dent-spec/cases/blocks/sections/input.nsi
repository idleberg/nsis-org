section "Main"
setoutpath $instdir
file "app.exe"
sectionend

function .oninit
strcpy $0 "1"
functionend
