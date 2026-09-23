Name "Example"

; the main section
Section "Main"
	DetailPrint "a"
SectionEnd

Section "Other"
	SectionGroup "Group"
		Section "Inner"
		SectionEnd
	SectionGroupEnd
SectionEnd

OutFile "example.exe"
