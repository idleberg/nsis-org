Function Retry
	start:
	DetailPrint "a"

	loop:
	DetailPrint "b"
	Goto loop

	; exit point
	done:
	finished:
	DetailPrint "c"
FunctionEnd
