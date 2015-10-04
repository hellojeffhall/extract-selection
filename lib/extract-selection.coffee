{CompositeDisposable} = require 'atom'

module.exports =
  subscriptions: null

  activate: (state) ->
    @subscriptions = new CompositeDisposable
    @subscriptions.add atom.commands.add 'atom-workspace', 'extract-selection:as-const': => @extract('const')
    @subscriptions.add atom.commands.add 'atom-workspace', 'extract-selection:as-let': => @extract('let')

  deactivate: ->
    @subscriptions.dispose()

  extract: (prefix) ->
    if editor = atom.workspace.getActiveTextEditor()
      value = editor.getSelectedText()
      if value and not editor.hasMultipleCursors()
        editor.transact ->
          symbol = _generateSymbol(value)
          origin = _calculateOrigin(editor)
          _renderExtractedLine(editor, prefix, symbol, value)
          _replaceOriginValueWithSymbol(editor, origin, value, symbol)
          _selectExtractedLineSymbol(editor, prefix, symbol)
          _selectOriginSymbol(editor, origin, symbol)


_calculateOrigin = (editor) ->
    range = editor.getSelectedBufferRange()
    row = range.start.row + 1
    column = range.start.column
    {row, column}


_generateSymbol = (text) ->
  text.replace /\W+/g, ''


_renderExtractedLine = (editor, prefix, symbol, value) ->
  editor.insertNewlineAbove()
  editor.insertText "#{prefix} #{symbol} = #{value};", autoIndent: true


_replaceOriginValueWithSymbol = (editor, origin, value, symbol) ->
  destination = [origin.row, origin.column + value.length]
  editor.setTextInBufferRange [origin, destination], symbol


_selectExtractedLineSymbol = (editor, prefix, symbol) ->
  cursor = editor.getLastCursor()
  cursor.moveToBeginningOfLine()
  cursor.moveToBeginningOfNextWord() unless cursor.isInsideWord()
  cursor.moveRight prefix.length + 1  # Account for the space
  cursor.selection.selectToBufferPosition
    column: cursor.getBufferColumn() + symbol.length
    row: cursor.getBufferRow()


_selectOriginSymbol = (editor, origin, symbol) ->
  cursor = editor.addCursorAtBufferPosition(origin)
  cursor.selection.selectToBufferPosition
    column: origin.column + symbol.length
    row: origin.row
