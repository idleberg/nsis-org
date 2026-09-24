section
messagebox mb_ok | mb_iconstop "Failed"
messagebox MB_YESNO |MB_ICONQUESTION "Continue?" idyes +2
messagebox ${MB_FLAGS}| MB_TOPMOST "Flags"
detailprint "a | b"
sectionend
