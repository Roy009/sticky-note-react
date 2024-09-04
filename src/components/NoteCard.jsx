/* eslint-disable react/prop-types */
import { useRef, useEffect, useState, useContext } from "react";
import { setNewOffset, autoGrow, setZIndex, bodyParser } from "../utils";
import { db } from "../appwrite/databases.js";
import Spinner from "../Icon/Spinner";
import DeleteButton from "../components/DeleteButton.jsx";
import { NoteContext } from "../context/NoteContext";
const NoteCard = ({ note }) => {
  const [saving, setSaving] = useState(false);
  const keyUpTimer = useRef(null);

  const body = bodyParser(note.body);
  const [position, setPosition] = useState(JSON.parse(note.position));
  const colors = JSON.parse(note.colors);

  let mouseStartPos = { x: 0, y: 0 };
  const cardRef = useRef(null);

  const textAreaRef = useRef(null);

  useEffect(() => {
    autoGrow(textAreaRef);
    setZIndex(cardRef.current);
  }, []);

  const saveData = async (key, value) => {
    const payload = { [key]: JSON.stringify(value) };
    try {
      await db.notes.update(note.$id, payload);
    } catch (error) {
      console.error(error);
    }
    setSaving(false);
  };

  const mouseMove = (e) => {
    //1 - Calculate move direction
    let mouseMoveDir = {
      x: mouseStartPos.x - e.clientX,
      y: mouseStartPos.y - e.clientY,
    };

    //2 - Update start position for next move.
    mouseStartPos.x = e.clientX;
    mouseStartPos.y = e.clientY;

    const newPosition = setNewOffset(cardRef.current, mouseMoveDir);
    //3 - Update card top and left position.
    setPosition(newPosition);
    setZIndex(cardRef.current);
  };
  const mouseUp = async () => {
    document.removeEventListener("mousemove", mouseMove);
    document.removeEventListener("mouseup", mouseUp);

    const newPosition = setNewOffset(cardRef.current); //{x,y}
    saveData("position", newPosition);
  };
  const { setSelectedNote } = useContext(NoteContext);
  const mouseDown = (e) => {
    if (e.target.className === "card-header") {
      setZIndex(cardRef.current);
      mouseStartPos.x = e.clientX;
      mouseStartPos.y = e.clientY;
      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp);
      setSelectedNote(note);
    }
  };

  const handleKeyUp = () => {
    setSaving(true);
    if (keyUpTimer.current) {
      clearTimeout(keyUpTimer.current);
    }
    keyUpTimer.current = setTimeout(() => {
      saveData("body", textAreaRef.current.value);
    }, 2000);
  };

  return (
    <div
      ref={cardRef}
      className="card"
      style={{
        backgroundColor: colors.colorBody,
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div
        className="card-header"
        onMouseDown={mouseDown}
        style={{ backgroundColor: colors.colorHeader }}
      >
        <DeleteButton noteId={note.$id} />
        {saving && (
          <div className="card-saving">
            <Spinner color={colors.colorText} />
            <span style={{ color: colors.colorText }}>Saving...</span>
          </div>
        )}
      </div>
      <div className="card-body">
        <textarea
          onKeyUp={handleKeyUp}
          onFocus={() => {
            setZIndex(cardRef.current);
            setSelectedNote(note);
          }}
          ref={textAreaRef}
          style={{ color: colors.colorText }}
          defaultValue={body}
          onInput={() => autoGrow(textAreaRef)}
        ></textarea>
      </div>
    </div>
  );
};

export default NoteCard;
