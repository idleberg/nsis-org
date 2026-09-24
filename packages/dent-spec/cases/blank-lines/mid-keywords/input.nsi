Function Test
${If} $0 == 1
${If} $1 == 2
DetailPrint "inner"
${EndIf}
${Else}
DetailPrint "outer"
${EndIf}
${If} $0 == 1
DetailPrint "a"
${ElseIf} $0 == 2
; nested
${If} $1 == 3
DetailPrint "b"
${EndIf}
${ElseIf} $0 == 4
DetailPrint "c"
${EndIf}
!ifdef X
!ifdef Y
Nop
!endif
!else
Nop
!endif
${Switch} $0
${Case} 1
${If} $1 == 2
DetailPrint "x"
${EndIf}
${Break}
${Case} 2
DetailPrint "y"
${Break}
${EndSwitch}
FunctionEnd
