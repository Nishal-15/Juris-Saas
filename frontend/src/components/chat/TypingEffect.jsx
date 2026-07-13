import { useState, useEffect } from "react";
import "./typing.css";

export default function TypingEffect({ text }) {

  const [output, setOutput] = useState("");

  useEffect(() => {
    let i = 0;
    setOutput("");

    const timer = setInterval(() => {
      setOutput(prev => prev + text.substring(i, i + 3));
      i += 3;
      if (i >= text.length) clearInterval(timer);
    }, 5);

    return () => clearInterval(timer);
  }, [text]);

  return (
    <span>
      {output}
      <span className="cursor">|</span>
    </span>
  );
}
