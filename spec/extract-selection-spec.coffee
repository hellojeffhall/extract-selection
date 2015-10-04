describe "extract-selection", ->
  editor = null
  view = null
  activationPromise = null

  beforeEach ->
    waitsForPromise ->
      atom.workspace.open('dummy.js')
    runs ->
      view = atom.views.getView(atom.workspace)
      editor = atom.workspace.getActiveTextEditor()
      jasmine.attachToDOM(view)
      activationPromise = atom.packages.activatePackage('extract-selection')
      activationPromise.fail -> (reason) -> throw reason

  it "can extract via `const`", ->
    select /'lorem ipsum'/
    waitsForPromise -> activationPromise
    atom.commands.dispatch view, 'extract-selection:as-const'
    runs -> assertExpectations("const loremipsum = 'lorem ipsum';\nvar alpha = loremipsum;\n", 'loremipsum')

  it "can extract via `let`", ->
    select /'lorem ipsum'/
    waitsForPromise -> activationPromise
    atom.commands.dispatch view, 'extract-selection:as-let'
    runs -> assertExpectations("let loremipsum = 'lorem ipsum';\nvar alpha = loremipsum;\n", 'loremipsum')

  assertExpectations = (expectedText, expectedSymbol) ->
    expect(atom.packages.isPackageActive('extract-selection')).toBe(true)
    selections = editor.getSelections()
    expect(editor.getText()).toEqual(expectedText)
    expect(selections).toHaveLength(2)
    expect(selections[0].getText()).toEqual(expectedSymbol)
    expect(selections[1].getText()).toEqual(expectedSymbol)

  select = (pattern) ->
    range = null
    offset = editor.scan pattern, (match) -> range = match.range
    if range
      cursor = editor.getLastCursor()
      cursor.setBufferPosition(range.start)
      cursor.selection.selectToBufferPosition(range.end)
    else
      throw new Error("Text doesn't contain pattern")
