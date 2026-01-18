import { Editor } from '@monaco-editor/react';
import { useState, useRef,useEffect } from 'react';

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
  height = '100vh',
  width = '100%',
  readOnly = false,
  codeValue, // Controlled code value from parent
  languageValue // Controlled language value from parent
}) => {
  const [currentFile] = useState<string>('main.py'); // Fixed single file

  // Use controlled values if provided, otherwise use internal state
  const effectiveCode = codeValue !== undefined ? codeValue : initialCode;
  const effectiveLanguage = languageValue !== undefined ? languageValue : initialLanguage;
  const editorRef = useRef<any>(null);

  // Update editor content when effectiveCode changes
  useEffect(() => {
    console.log("Effective code changed in CodeEditor:", effectiveCode?.substring(0, 50));
    if (editorRef.current && effectiveCode !== undefined) {
      // Get the current model
      const model = editorRef.current.getModel();

      if (model) {
        // Get current value in the editor
        const currentValue = model.getValue();

        // Only update if the values are different to avoid unnecessary updates
        if (currentValue !== effectiveCode) {
          console.log("Updating editor with new value from other user");

          // Use the editor's model to set the new value
          model.setValue(effectiveCode);
        }
      }
    }
  }, [effectiveCode]);

  // Update editor language when effectiveLanguage changes
  useEffect(() => {
    if (editorRef.current && effectiveLanguage) {
      const model = editorRef.current.getModel();
      if (model) {
        console.log("Updating editor language to:", effectiveLanguage);
        // Use the editor's built-in method to update language
        editorRef.current.updateOptions({ language: effectiveLanguage });
      }
    }
  }, [effectiveLanguage]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Set initial language if available
    if (effectiveLanguage) {
      editor.updateOptions({ language: effectiveLanguage });
    }
  };

  const handleCodeChangeInternal = (newValue: string | undefined) => {
    if (onCodeChange) {
      onCodeChange(newValue, effectiveLanguage, 'main.py'); // Use consistent filename
      console.log("VALUE-->>>",newValue)
    }
  };

  return (
    <div className="editor-container flex h-full bg-gray-900 text-white">
      {/* Simple Editor Area - Full width since we removed file explorer */}
      <div className="w-full flex flex-col">
        {/* Tab Bar with filename and language selector */}
        <div className="bg-gray-800 border-b border-gray-700 flex items-center">
          <div className="px-4 py-2 text-sm bg-gray-900 text-white border-r border-gray-700">
            {/* <div className="flex items-center">
              🐍 main.py
            </div> */}
          </div>

          {/* Language selector dropdown */}
          <select
            value={effectiveLanguage}
            onChange={(e) => {
              // Update the language in the parent component by triggering a code change with the same code but new language
              if (onCodeChange) {
                onCodeChange(effectiveCode, e.target.value, 'main.py');
              }
            }}
            className="bg-gray-700 text-white border-none focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2 text-sm"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="typescript">TypeScript</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="php">PHP</option>
            <option value="ruby">Ruby</option>
            <option value="sql">SQL</option>
          </select>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <Editor
            height="100vh"
            width="100%"
            theme={theme}
            onMount={handleEditorDidMount}
            path='main.py'
            language={effectiveLanguage}
            value={effectiveCode} // Controlled value that updates the editor
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
