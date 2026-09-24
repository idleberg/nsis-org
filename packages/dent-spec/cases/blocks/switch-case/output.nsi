${Switch} $0
	${Case} 1
		DetailPrint "one"
		${Break}

	${Case} 2
		DetailPrint "two"
		${Break}

	${Default}
		DetailPrint "other"
${EndSwitch}
