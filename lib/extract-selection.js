'use babel'

import { CompositeDisposable } from 'atom'

import {
    textToSnakeCase,
    textToLowerSnakeCase,
    textToUpperSnakeCase,
    textToKebabCase,
    textToLowerKebabCase,
    textToUpperKebabCase,
    textToLowerCamelCase,
    textToUpperCamelCase,
    caseToFunctionDictionary,
} from '../lib/textToCaseFunctions'

const removeNonWordOtherThanSpace = text => text.replace(/[^\w\s]+/g, '')

const generateName = ({text, capitalizationMode }) => {
  const lettersAndSpacesOnly = removeNonWordOtherThanSpace(text)
  return !caseToFunctionDictionary[capitalizationMode] ?
  lettersAndSpacesOnly :
  caseToFunctionDictionary[capitalizationMode](lettersAndSpacesOnly)
}

const calculateOrigin = editor => {
  const {start} = editor.getSelectedBufferRange()
  return {
    row : start.row + 1,
    column: start.column
  }
}

const renderExtractedLine = (editor, prefix, symbol, value, lineEndChars) => {
  editor.insertNewlineAbove()
  editor.insertText(`${prefix} ${symbol} = ${value}${lineEndChars}`, {autoIndent: true})
}

const replaceOriginValueWithSymbol = (editor, origin, value, symbol) => {
  const destination = [origin.row, origin.column + value.length]
  console.log(editor, origin, value, symbol, destination)
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

const performTransaction = ({value, editor, prefix, lineEndChars, capitalizationMode}) => {
  const symbol = generateName({text : value, capitalizationMode})
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
    },
    capitalizationMode : {
      title : 'Choose a capitalization rule:',
      type : 'string',
      default : 'lowerCamel',
      enum : [
        { value : 'lowerCamel' , description : 'lowerCamelCase' },
        { value : 'upperCamel' , description : 'UpperCamelCase' },
        { value : 'lowerSnake' , description : 'lower_snake_case' },
        { value : 'upperSnake' , description : 'UPPER_SNAKE_CASE' },
        { value : 'asIsSnake' , description : 'snake_case_without_changing_capitalization' },
        { value : 'lowerKebab' , description : 'lower-kebab-case' },
        { value : 'upperKebab' , description : 'UPPER-KEBAB-CASE' },
        { value : 'asIsKebab' , description : 'kebab-case-without-changing-capitalization' },
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
    const capitalizationMode = atom.config.get('extract-selection.capitalizationMode')

    const editor = atom.workspace.getActiveTextEditor()
    if( !editor )
      return

    const value = editor.getSelectedText()
    if(!value || editor.hasMultipleCursors() )
      return

    editor.transact( () => {
      performTransaction({value, editor, prefix, lineEndChars, capitalizationMode})
    })
  }
}
