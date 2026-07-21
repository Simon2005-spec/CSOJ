// app.js
import { db } from './firebaseConfig.js'; // Note the relative path './' and '.js' extension
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const saveQuestionBtn = document.getElementById('saveQuestionBtn'); 

saveQuestionBtn.addEventListener('click', async () => {
  const questionData = {
    title: document.getElementById('questionTitle').value,
    description: document.getElementById('questionDesc').value,
    difficulty: document.getElementById('difficultySelect').value,
    testCases: [
      { input: "1 2", output: "3" }
    ],
    rules: {
      timeLimit: "1000ms",
      memoryLimit: "256MB"
    },
    createdAt: serverTimestamp()
  };

  try {
    const questionsCollectionRef = collection(db, 'questions');
    const docRef = await addDoc(questionsCollectionRef, questionData);
    console.log("Saved with ID:", docRef.id);
  } catch (error) {
    console.error("Error saving:", error);
  }
});