'use babel'

// Reference on getting package activation to work in specs:
// https://discuss.atom.io/t/need-help-with-writing-specs-around-package-activation/15053

import path from 'path'

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

const prefixes = ['let', 'const']

const caseToNameDictionary = {
  asIsSnake  : 'lorem_ipsum',
  lowerSnake : 'lorem_ipsum',
  upperSnake : 'LOREM_IPSUM',
  asIsKebab  : 'lorem-ipsum',
  lowerKebab : 'lorem-ipsum',
  upperKebab : 'LOREM-IPSUM',
  lowerCamel : 'loremIpsum',
  upperCamel : 'LoremIpsum',
}

const assertExpectations = ({expectedText, expectedName, atom, editor}) => {
  expect(atom.packages.isPackageActive('extract-selection')).toBe(true)
  selections = editor.getSelections()
  expect(editor.getText()).toEqual(expectedText)
  expect(selections).toHaveLength(2)
  expect(selections[0].getText()).toEqual(expectedName)
  expect(selections[1].getText()).toEqual(expectedName)
}

const runSingleTest = ({prefix, editor, atom, view}) => {
  select({ pattern : /'lorem ipsum'/, editor})
  lineEndChars = atom.config.get('extract-selection.lineEndChars')
  capitalizationMode = atom.config.get('extract-selection.capitalizationMode')
  expectedName = caseToNameDictionary[capitalizationMode]
  calculatedName = caseToFunctionDictionary[capitalizationMode]('lorem ipsum')
  atom.commands.dispatch( view, `extract-selection:as-${prefix}`)
  runs( () => assertExpectations({
    expectedText : `${prefix} ${calculatedName} = 'lorem ipsum'${lineEndChars}\nvar alpha = ${calculatedName};\n`,
    expectedName,
    atom,
    editor
  }))
}

const select = ({pattern, editor}) => {
  range = null
  offset = editor.scan( pattern , match => range = match.range)
  if(range){
    cursor = editor.getLastCursor()
    cursor.setBufferPosition(range.start)
    cursor.selection.selectToBufferPosition(range.end)
  }
  else
    throw new Error("Text doesn't contain pattern")
}

describe('When we open the test file', ()=>{
  let editor = null
  let view = null
  beforeEach( ()=>{
    waitsForPromise(()=>{
      return atom.workspace.open( path.join( __dirname , 'dummy.js')  )
    })

  })
  it('should see our default text.', ()=>{
    view = atom.views.getView(atom.workspace)
    jasmine.attachToDOM(view)
    editor = atom.workspace.getActiveTextEditor()
    expect( editor.getText() ).toEqual(`var alpha = 'lorem ipsum';\n`)
  })
})

describe( 'When we activate the package', ()=>{

  const casesToTest = Object.keys(caseToNameDictionary)
  const prefixesToTest = prefixes
  const testParamGroups = casesToTest.reduce( function(testParamGroup, capitalizationMode) {
    const prefixesForThisCase = prefixesToTest.map( x => {
      return { capitalizationMode, prefix : x}
    })
    return [...testParamGroup, ...prefixesForThisCase]
  }, [] )

  let editor = null
  let view = null

  let [activationPromise, workspaceElement] = []

  executeCommand = callback => {
    atom.commands.dispatch(workspaceElement, 'extract-selection:as-const')
    waitsForPromise( () => activationPromise)
    runs(callback)
  }

  beforeEach( ()=>{
    waitsForPromise(()=>{
      return atom.workspace.open( path.join( __dirname , 'dummy.js')  )
    })
    workspaceElement = atom.views.getView(atom.workspace)
    activationPromise = atom.packages.activatePackage('extract-selection')
  })

  it( 'the package should become active', ()=>{
    executeCommand( ()=>{
      expect(atom.packages.isPackageActive('extract-selection')).toBe(true)
    })
  })

  testParamGroups.forEach( x => {
    const {prefix, capitalizationMode} = x
    it( `should extract a ${prefix} in ${capitalizationMode} case`, ()=>{
      atom.config.set('extract-selection.capitalizationMode', capitalizationMode)
      view = atom.views.getView(atom.workspace)
      jasmine.attachToDOM(view)
      editor = atom.workspace.getActiveTextEditor()
      executeCommand( ()=>{
        runSingleTest({prefix, capitalizationMode, editor, atom, view})
      })
    })
  })
})
