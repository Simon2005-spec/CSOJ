import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export function QuestionSaveButton() {

  const handleSave = async () => {
    try {
      // Direct save to the 'questions' collection
      const docRef = await addDoc(collection(db, 'questions'), {
        title: "Sample Question",
        description: "Problem description goes here...",
        createdAt: serverTimestamp()
      });

      console.log("Document written with ID: ", docRef.id);
      alert("Successfully saved to Firestore!");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to save.");
    }
  };

  return (
    <button onClick={handleSave}>
      Save Question
    </button>
  );
}