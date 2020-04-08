import { Answers, Question, prompt } from "inquirer";

export const askDetails = () => {
  const questions: Question<Answers>[] = [
    {
      name: "url",
      type: "input",
      message: "Playlist Url",
    },
    {
      name: "output",
      type: "input",
      message: "Output path",
    },
  ];
  return prompt(questions);
};
