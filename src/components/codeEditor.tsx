
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
    <div className="flex h-full w-full bg-[#0D1117] text-gray-200">
      <div className="flex w-full flex-col overflow-hidden">
        
        {/* Minimal Top Bar */}
        <div className="flex h-[40px] items-center justify-between border-b border-gray-800 bg-[#0D1117] px-3">
          
          {/* File label (future-proof, still minimal) */}
          <div className="text-xs text-gray-400 tracking-wide">
            {currentFile}
          </div>

          {/* Language selector */}
          <select
            value={effectiveLanguage}
            onChange={(e) => {
              if (onCodeChange) {
                onCodeChange(effectiveCode, e.target.value, 'main.py');
              }
            }}
            className="bg-[#0D1117] text-gray-300 text-xs border border-gray-800 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-gray-700"
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
        <div className="flex-1 overflow-hidden">
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
              minimap: { enabled: true },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto'
              },
              overviewRulerLanes: 2,
              overviewRulerBorder: false,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
