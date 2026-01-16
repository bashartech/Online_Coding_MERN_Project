import { Editor } from '@monaco-editor/react'
import { useRef, useState } from 'react';

const files: { [key: string]: { name: string; language: string; value: string } } = {

"main.py": {
  name: "main.py",
  language: "python",
  value: "print(\"Hello World\")"
},
"index.html": {
  name: "index.html",
  language: "html",
  value: "<div> hello world </div>"
},
"app.ts": {
  name: "app.ts",
  language: "typescript",
  value: "console.log(\"Hello World\");"
},
"app.js": {
  name: "app.js",
  language: "javascript",
  value: "console.log(\"Hello World\");"
},
"hello.cpp": {
  name: "hello.cpp",
  language: "c++",
  value: "#include <iostream>\nint main() {\n    std::cout << \"Hello World\" << std::endl;\n    return 0;\n}"
},
}

const codeEditor = () => {

  const [fileName, setFileName] = useState("main.py"); // change to "index.html"
  const editorRef:any = useRef(null);
  const file = files[fileName];


   function handleEditorDidMount(editor:any, monaco:any) {
    editorRef.current = editor;
  }

  function getEditorValue() {
    alert(editorRef.current.getValue());
  }

  return (
    <div className="App">
      <button className='bg-black text-white' onClick={() => setFileName("index.html")}>
        Switch to index.html
      </button>
      <button className='bg-black text-white' onClick={() => setFileName("app.ts")}>
        Switch to app.ts
      </button>
      <button className='bg-black text-white' onClick={() => setFileName("hello.cpp")}>
        Switch to hello.cpp
      </button>
      <button className='bg-black text-white' onClick={() => setFileName("app.js")}>
        Switch to app.js
      </button>
      <button className='bg-black text-white' onClick={() => setFileName("main.py")}>
        Switch to main.py
      </button>
      <button className='bg-black text-white' onClick={() => getEditorValue()}>
        Get Editor Value
      </button>
      <Editor
        height="100vh"
        width="100%"
        theme="vs-dark"
        onMount={handleEditorDidMount}
        path={file.name}
        defaultLanguage={file.language}
        defaultValue={file.value}
      />
    </div>
  )
}

export default codeEditor
