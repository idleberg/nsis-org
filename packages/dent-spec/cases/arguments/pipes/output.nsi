Section
	MessageBox MB_OK|MB_ICONSTOP "Failed"
	MessageBox MB_YESNO|MB_ICONQUESTION "Continue?" IDYES +2
	MessageBox ${MB_FLAGS}|MB_TOPMOST "Flags"
	DetailPrint "a | b"
SectionEnd
