Section
	MessageBox MB_OK|MB_ICONSTOP|MB_TOPMOST \
		"An error occurred while installing the files."
	MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2|MB_TOPMOST|MB_SETFOREGROUND \
		"Uninstall first?" IDYES +2
SectionEnd
