type Contact = {
  name: string;
  email: string;
  instagram: string;
  trainingHours: TrainingSlot[];
};

type TrainingSlot = {
  start: Date;
  end: Date;
  location: string;
};

function weekdayToNumber(weekday: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday"): number {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days.indexOf(weekday);
}

function createTrainingSlot(
  startDay: number,
  startHour: number,
  startMinute: number,
  endDay: number,
  endHour: number,
  endMinute: number,
  location: string
): TrainingSlot {
  const start = new Date(0);
  start.setHours(startHour, startMinute, 0, 0);
  start.setDate(start.getDate() + ((startDay - start.getDay() + 7) % 7)); // Adjust to the correct day of the week

  const end = new Date(0);
  end.setHours(endHour, endMinute, 0, 0);
  end.setDate(end.getDate() + ((endDay - end.getDay() + 7) % 7)); // Adjust to the correct day of the week

  return { start, end, location };
}

export const contact: Contact = {
  name: "Fusian Dance Crew",
  email: "fusianmunich@gmail.com",
  instagram: "https://www.instagram.com/fusiandance/",
  trainingHours: [
    createTrainingSlot(weekdayToNumber("Sunday"), 19, 0, weekdayToNumber("Sunday"), 20, 30, "Fusian Studio"),
    createTrainingSlot(
      weekdayToNumber("Wednesday"),
      19,
      0,
      weekdayToNumber("Wednesday"),
      20,
      30,
      "Fusian Studio"
    ),
  ],
};
