'use babel'

import { CompositeDisposable } from 'atom'

//Turn selected text into a variable name
const generateSymbol = text => text.replace(/\W+/g, '')


const calculateOrigin = editor => {
  const {start} = editor.getSelectedBufferRange()
  return {
    row : start.row + 1,
    column: start.column
  }
}

//Write the new variable declaration.
const renderExtractedLine = (editor, prefix, symbol, value, lineEndChars) => {
  editor.insertNewlineAbove()
  editor.insertText(`${prefix} ${symbol} = ${value}${lineEndChars}`, {autoIndent: true})
}

// Replace selected text with new variable name
const replaceOriginValueWithSymbol = (editor, origin, value, symbol) => {
  const destination = [origin.row, origin.column + value.length]
  editor.setTextInBufferRange( [origin, destination], symbol )
}

const selectExtractedLineSymbol = (editor, prefix, symbol) => {
  const cursor = editor.getLastCursor()
  cursor.moveToBeginningOfLine()
  if( !cursor.isInsideWord() ){
    cursor.moveToBeginningOfNextWord()
  }
  const whitespaceLength = 1
  cursor.moveRight( prefix.length + whitespaceLength)

  cursor.selection.selectToBufferPosition({
    column: cursor.getBufferColumn() + symbol.length ,
    row: cursor.getBufferRow()
  })
}

const performTransaction = ({value, editor, prefix, lineEndChars}) => {
  const symbol = generateSymbol(value)
  const origin = calculateOrigin(editor)
  renderExtractedLine(editor, prefix, symbol, value, lineEndChars)
  replaceOriginValueWithSymbol(editor, origin, value, symbol)
  selectExtractedLineSymbol(editor, prefix, symbol)

  selectOriginSymbol(editor, origin, symbol)
}

const selectOriginSymbol = (editor, origin, symbol) => {
  const cursor = editor.addCursorAtBufferPosition(origin)
  cursor.selection.selectToBufferPosition({
    column: origin.column + symbol.length,
    row: origin.row
  })
}

module.exports = {
  config : {
    lineEndChars : {
      title : 'Character(s) at the end of lines that declare variables.',
      type : 'string',
      default : '',
      enum : [
        { value : '' , description : `None`},
        { value : ';' , description : `Semicolon only`},
        { value : ' ;' , description : `Space, then semicolon`},
      ]
    }
  },

  subscriptions: null,

  activate(state){
    this.subscriptions = new CompositeDisposable
    this.subscriptions.add( atom.commands.add( 'atom-workspace', {
      'extract-selection:as-const': () => this.extract('const')
    }))
    this.subscriptions.add( atom.commands.add( 'atom-workspace', {
      'extract-selection:as-let': () => this.extract('let')
    }))
  },

  deactivate(){
    this.subscriptions.dispose()
  },

  extract(prefix){
    const lineEndChars = atom.config.get('extract-selection.lineEndChars')

    const editor = atom.workspace.getActiveTextEditor()
    if( !editor )
      return

    const value = editor.getSelectedText()
    if(!value || editor.hasMultipleCursors() )
      return

    editor.transact( () => {
      performTransaction({value, editor, prefix, lineEndChars})
    })
  }
}
