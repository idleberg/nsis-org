Section
	IntOp $0 $1 + 5
	IntOp $0 $0 * -1
	IntOp $0 $0 >>> 2
	IntOp $0 $1 ~
	IntOp $0 $0 << ${SHIFT}
	IntPtrOp $0 $1 & 0xff
	IntOp $0 $1 || $2
SectionEnd
