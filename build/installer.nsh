; Adds a Start menu entry for each PocketTool app. They all run the same program,
; which opens the right app from the --app= setting.
!macro customInstall
  CreateShortCut "$SMPROGRAMS\PocketTool Lens.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "--app=lens" "$INSTDIR\resources\icons\lens.ico" 0 "" "" "Lens: image tools"
  CreateShortCut "$SMPROGRAMS\PocketTool Folio.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "--app=folio" "$INSTDIR\resources\icons\folio.ico" 0 "" "" "Folio: PDF tools"
  CreateShortCut "$SMPROGRAMS\PocketTool Reel.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "--app=reel" "$INSTDIR\resources\icons\reel.ico" 0 "" "" "Reel: video and audio tools"
  CreateShortCut "$SMPROGRAMS\PocketTool Kit.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "--app=kit" "$INSTDIR\resources\icons\kit.ico" 0 "" "" "Kit: everyday utilities"
  CreateShortCut "$SMPROGRAMS\PocketTool Cloak.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "--app=cloak" "$INSTDIR\resources\icons\cloak.ico" 0 "" "" "Cloak: privacy tools"
!macroend

!macro customUnInstall
  Delete "$SMPROGRAMS\PocketTool Lens.lnk"
  Delete "$SMPROGRAMS\PocketTool Folio.lnk"
  Delete "$SMPROGRAMS\PocketTool Reel.lnk"
  Delete "$SMPROGRAMS\PocketTool Kit.lnk"
  Delete "$SMPROGRAMS\PocketTool Cloak.lnk"
!macroend
