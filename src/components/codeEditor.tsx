'use client';

import React from "react"


// export default CodeEditor;

import { Editor } from '@monaco-editor/react';
import { useState, useRef, useEffect } from 'react';

interface CodeEditorProps {
  initialCode?: string;
  initialLanguage?: string;
  onCodeChange?: (value: string | undefined, language: string, fileName: string) => void;
  theme?: string;
  height?: string;
  width?: string;
  readOnly?: boolean;
  // New props to make the editor controlled by external state
  codeValue?: string;
  languageValue?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode = "// Start coding here...\nconsole.log('Hello World');",
  initialLanguage = 'python',
  onCodeChange,
  theme = 'vs-dark',
  readOnly = false,
  codeValue,
  languageValue
}) => {
  const [currentFile] = useState<string>(''); // Fixed single file

  const effectiveCode = codeValue !== undefined ? codeValue : initialCode;
  const effectiveLanguage = languageValue !== undefined ? languageValue : initialLanguage;

  const editorRef = useRef<any>(null);

  useEffect(() => {
    console.log("Effective code changed in CodeEditor:", effectiveCode?.substring(0, 50));
    if (editorRef.current && effectiveCode !== undefined) {
      const model = editorRef.current.getModel();
      if (model) {
        const currentValue = model.getValue();
        if (currentValue !== effectiveCode) {
          console.log("Updating editor with new value from other user");
          model.setValue(effectiveCode);
        }
      }
    }
  }, [effectiveCode]);

  useEffect(() => {
    if (editorRef.current && effectiveLanguage) {
      const model = editorRef.current.getModel();
      if (model) {
        console.log("Updating editor language to:", effectiveLanguage);
        editorRef.current.updateOptions({ language: effectiveLanguage });
      }
    }
  }, [effectiveLanguage]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    if (effectiveLanguage) {
      editor.updateOptions({ language: effectiveLanguage });
    }
  };

  const handleCodeChangeInternal = (newValue: string | undefined) => {
    if (onCodeChange) {
      onCodeChange(newValue, effectiveLanguage, 'main.py');
      console.log("VALUE-->>>", newValue);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-700 text-slate-200">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between h-12 px-4 bg-slate-900 border-b border-slate-700 gap-4">
        {/* File Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">
              {currentFile || 'untitled'}
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400">
              {effectiveLanguage.charAt(0).toUpperCase() + effectiveLanguage.slice(1)}
            </span>
          </div>
        </div>

        {/* Language Selector */}
        <select
          value={effectiveLanguage}
          onChange={(e) => {
            if (onCodeChange) {
              onCodeChange(effectiveCode, e.target.value, 'main.py');
            }
          }}
          className="ml-auto bg-slate-800 text-slate-100 text-xs border border-slate-700 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-600 transition-colors cursor-pointer"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="php">PHP</option>
          <option value="ruby">Ruby</option>
          <option value="sql">SQL</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
        </select>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 pt-1 overflow-hidden bg-neutral-900">
        <Editor
          height="100%"
          width="100%"
          theme={theme}
          onMount={handleEditorDidMount}
          path="main.py"
          language={effectiveLanguage}
          value={effectiveCode}
          onChange={handleCodeChangeInternal}
          options={{
            readOnly,
            minimap: { enabled: true, scale: 1 },
            fontSize: 13,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            lineNumbers: 'on',
            roundedSelection: false,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalSliderSize: 10,
              horizontalSliderSize: 10,
            },
            overviewRulerLanes: 2,
            overviewRulerBorder: false,
            bracketPairColorization: {
              enabled: true,
            },
            
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
