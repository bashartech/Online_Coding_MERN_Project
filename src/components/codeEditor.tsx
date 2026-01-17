import { Editor } from '@monaco-editor/react';
import { useState, useRef } from 'react';

interface CodeEditorProps {
  initialCode?: string;
  initialLanguage?: string;
  initialFileName?: string;
  onCodeChange?: (value: string | undefined, language: string, fileName: string) => void;
  theme?: string;
  height?: string;
  width?: string;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode = "// Start coding here...\nconsole.log('Hello World');",
  initialLanguage = 'javascript',
  initialFileName = 'index.js',
  onCodeChange,
  theme = 'vs-dark',
  height = '100vh',
  width = '100%',
  readOnly = false
}) => {
  // Predefined files with different languages
  const files: { [key: string]: { name: string; language: string; value: string } } = {
    "main.py": {
      name: "main.py",
      language: "python",
      value: "print(\"Hello World\")\n# Start coding in Python"
    },
    "index.html": {
      name: "index.html",
      language: "html",
      value: "<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello World</title>\n</head>\n<body>\n  <div>hello world</div>\n</body>\n</html>"
    },
    "app.ts": {
      name: "app.ts",
      language: "typescript",
      value: "console.log(\"Hello World\");\n// Start coding in TypeScript"
    },
    "app.js": {
      name: "app.js",
      language: "javascript",
      value: "console.log(\"Hello World\");\n// Start coding in JavaScript"
    },
    "hello.cpp": {
      name: "hello.cpp",
      language: "cpp",
      value: "#include <iostream>\n\nint main() {\n    std::cout << \"Hello World\" << std::endl;\n    return 0;\n}// Start coding in C++"
    },
    "styles.css": {
      name: "styles.css",
      language: "css",
      value: "/* Start styling */\nbody {\n  margin: 0;\n  padding: 0;\n  font-family: sans-serif;\n}\n\n.container {\n  width: 100%;\n  max-width: 1200px;\n  margin: 0 auto;\n}"
    }
  };

  // Determine the initial file configuration based on initialFileName
  const initialFileConfig = files[initialFileName] || {
    name: initialFileName,
    language: initialLanguage,
    value: initialCode
  };

  const [currentFile, setCurrentFile] = useState<string>(initialFileName);
  const [code, setCode] = useState<string>(initialFileConfig.value);
  const [language, setLanguage] = useState<string>(initialFileConfig.language);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
  };

  const handleCodeChangeInternal = (newValue: string | undefined) => {
    setCode(newValue || '');
    if (onCodeChange) {
      onCodeChange(newValue, language, currentFile);
    }
  };

  const switchFile = (fileName: string) => {
    const file = files[fileName];
    if (file) {
      setCurrentFile(file.name);
      setLanguage(file.language);
      setCode(file.value);
      if (onCodeChange) {
        onCodeChange(file.value, file.language, file.name);
      }
    }
  };

  return (
    <div className="editor-container flex h-full bg-gray-900 text-white">
      {/* Left Sidebar - File Explorer */}
      <div className="w-1/5 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700 bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-300">EXPLORER</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">FILES</div>
            <div className="space-y-1">
              {Object.keys(files).map((fileName) => (
                <button
                  key={fileName}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded flex items-center ${
                    currentFile === files[fileName].name
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => switchFile(fileName)}
                >
                  <span className="mr-2">
                    {fileName.endsWith('.js') || fileName.endsWith('.ts') ? '📄' :
                     fileName.endsWith('.py') ? '🐍' :
                     fileName.endsWith('.html') ? '🌐' :
                     fileName.endsWith('.css') ? '🎨' :
                     fileName.endsWith('.cpp') ? '⚙️' : '📄'}
                  </span>
                  <span className="truncate">{fileName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Area - 80% width */}
      <div className="w-4/5 flex flex-col">
        {/* Tab Bar */}
        <div className="bg-gray-800 border-b border-gray-700 flex items-center">
          <div className={`px-4 py-2 text-sm border-r border-gray-700 ${
            currentFile === files[currentFile]?.name
              ? 'bg-gray-900 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}>
            <div className="flex items-center">
              <span className="mr-2">
                {currentFile.endsWith('.js') || currentFile.endsWith('.ts') ? '📄' :
                 currentFile.endsWith('.py') ? '🐍' :
                 currentFile.endsWith('.html') ? '🌐' :
                 currentFile.endsWith('.css') ? '🎨' :
                 currentFile.endsWith('.cpp') ? '⚙️' : '📄'}
              </span>
              {currentFile}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <Editor
            height="100vh"
            width="100vh"
            theme={theme}
            onMount={handleEditorDidMount}
            path={currentFile}
            defaultLanguage={language}
            defaultValue={code}
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
