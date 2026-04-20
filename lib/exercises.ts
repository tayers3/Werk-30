export type MuscleGroup =
  | "full-body"
  | "upper-body"
  | "lower-body"
  | "core"
  | "cardio"
  | "stretching"
  | "accessories";

export type ExerciseType = "main" | "accessory";

export type Intensity = "low" | "medium" | "high";

export type Location = "gym" | "home";

/** Reps can be a number (e.g. 10), a range string (e.g. "8-12"), or a timed string (e.g. "30 sec"). */
export type Reps = number | `${number}-${number}` | string;

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  intensity: Intensity;
  /** Duration of the exercise block in seconds. */
  duration: number;
  description: string;
  instructions?: string[];
  sets: number;
  reps: Reps;
  locations?: Location[];
  youtube?: string;
  /** Defaults to "main" when not specified. */
  type?: ExerciseType;
}

export const exercises: Exercise[] = [
  // 🔴 UPPER BODY (GYM)
  { id:"bench", name:"Bench Press", description:"Barbell chest press", muscleGroup:"upper-body", intensity:"high", duration:300, sets:4, reps:"6-10", locations:["gym"], youtube:"https://www.youtube.com/watch?v=rT7DgCr-3pg"},
  { id:"incline", name:"Incline Bench Press", description:"Upper chest", muscleGroup:"upper-body", intensity:"high", duration:300, sets:4, reps:"8-10", locations:["gym"], youtube:"https://www.youtube.com/watch?v=8iPEnn-ltC8"},
  { id:"decline", name:"Decline Bench Press", description:"Lower chest", muscleGroup:"upper-body", intensity:"medium", duration:300, sets:3, reps:"8-12", locations:["gym"], youtube:"https://www.youtube.com/watch?v=0G2_XV7slIg"},
  { id:"latpull", name:"Lat Pulldown", description:"Back width", muscleGroup:"upper-body", intensity:"medium", duration:300, sets:3, reps:"10-12", locations:["gym"], youtube:"https://www.youtube.com/watch?v=CAwf7n6Luuc"},
  { id:"row", name:"Seated Cable Row", description:"Back thickness", muscleGroup:"upper-body", intensity:"medium", duration:300, sets:3, reps:"10-12", locations:["gym"], youtube:"https://www.youtube.com/watch?v=GZbfZ033f74"},
  { id:"ohp", name:"Overhead Press", description:"Shoulder strength", muscleGroup:"upper-body", intensity:"high", duration:300, sets:4, reps:"6-10", locations:["gym"], youtube:"https://www.youtube.com/watch?v=2yjwXTZQDDI"},
  { id:"lateral", name:"Lateral Raise Machine", description:"Shoulders", muscleGroup:"upper-body", intensity:"low", duration:300, sets:3, reps:"12-15", locations:["gym"], youtube:"https://www.youtube.com/watch?v=3VcKaXpzqRo"},
  { id:"tricepPush", name:"Cable Tricep Pushdown", description:"Triceps isolation", muscleGroup:"upper-body", intensity:"low", duration:300, sets:3, reps:"12-15", locations:["gym"], youtube:"https://www.youtube.com/watch?v=2-LAMcpzODU"},
  { id:"preacher", name:"Preacher Curl", description:"Biceps isolation", muscleGroup:"upper-body", intensity:"low", duration:300, sets:3, reps:"10-12", locations:["gym"], youtube:"https://www.youtube.com/watch?v=fIWP-FRFNU0"},

  // 🔵 LOWER BODY (GYM)
  { id:"squat", name:"Barbell Squat", description:"Compound leg movement", muscleGroup:"lower-body", intensity:"high", duration:300, sets:4, reps:"5-8", locations:["gym"], youtube:"https://www.youtube.com/watch?v=ultWZbUMPL8"},
  { id:"legpress", name:"Leg Press", description:"Machine leg work", muscleGroup:"lower-body", intensity:"medium", duration:300, sets:3, reps:"10-12", locations:["gym"], youtube:"https://www.youtube.com/watch?v=IZxyjW7MPJQ"},
  { id:"deadlift", name:"Deadlift", description:"Posterior chain", muscleGroup:"lower-body", intensity:"high", duration:300, sets:4, reps:"5-8", locations:["gym"], youtube:"https://www.youtube.com/watch?v=op9kVnSso6Q"},
  { id:"rdl", name:"Romanian Deadlift", description:"Hamstrings", muscleGroup:"lower-body", intensity:"high", duration:300, sets:4, reps:"6-10", locations:["gym"], youtube:"https://www.youtube.com/watch?v=2SHsk9AzdjA"},
  { id:"legcurl", name:"Leg Curl Machine", description:"Hamstrings", muscleGroup:"lower-body", intensity:"medium", duration:300, sets:3, reps:"10-12", locations:["gym"], youtube:"https://www.youtube.com/watch?v=1Tq3QdYUuHs"},
  { id:"legext", name:"Leg Extension", description:"Quadriceps", muscleGroup:"lower-body", intensity:"medium", duration:300, sets:3, reps:"10-12", locations:["gym"], youtube:"https://www.youtube.com/watch?v=YyvSfVjQeL0"},
  { id:"hipthrust", name:"Hip Thrust", description:"Glutes", muscleGroup:"lower-body", intensity:"medium", duration:300, sets:3, reps:"10-12", locations:["gym"], youtube:"https://www.youtube.com/watch?v=LM8XHLYJoYs"},
  { id:"calfraise", name:"Standing Calf Raise", description:"Calves", muscleGroup:"lower-body", intensity:"low", duration:300, sets:4, reps:"15-20", locations:["gym"], youtube:"https://www.youtube.com/watch?v=YMmgqO8Jo-k"},
  { id:"hack", name:"Hack Squat Machine", description:"Quad focused", muscleGroup:"lower-body", intensity:"high", duration:300, sets:4, reps:"8-10", locations:["gym"], youtube:"https://www.youtube.com/watch?v=0tn5K9NlCfo"},

  // 🟢 CORE (GYM)
  { id:"abcrunch", name:"Cable Crunch", description:"Weighted abs", muscleGroup:"core", intensity:"medium", duration:300, sets:3, reps:"12-15", locations:["gym"], youtube:"https://www.youtube.com/watch?v=2fCzN6rP2cE"},
  { id:"abmachine", name:"Ab Machine", description:"Core isolation", muscleGroup:"core", intensity:"medium", duration:300, sets:3, reps:"12-15", locations:["gym"], youtube:"https://www.youtube.com/watch?v=1fbU_MkV7NE"},
  { id:"hangingleg", name:"Hanging Leg Raise", description:"Lower abs", muscleGroup:"core", intensity:"high", duration:300, sets:3, reps:"10-15", locations:["gym"], youtube:"https://www.youtube.com/watch?v=Pr1ieGZ5atk"},
  { id:"declineSit", name:"Decline Sit-ups", description:"Core strength", muscleGroup:"core", intensity:"medium", duration:300, sets:3, reps:"12-15", locations:["gym"], youtube:"https://www.youtube.com/watch?v=1fbU_MkV7NE"},
  { id:"russian", name:"Weighted Russian Twists", description:"Obliques", muscleGroup:"core", intensity:"medium", duration:300, sets:3, reps:"20", locations:["gym"], youtube:"https://www.youtube.com/watch?v=wkD8rjkodUI"},
  { id:"abwheel", name:"Ab Wheel Rollout", description:"Advanced core", muscleGroup:"core", intensity:"high", duration:300, sets:3, reps:"8-12", locations:["gym"], youtube:"https://www.youtube.com/watch?v=9ZCoXkq6i5A"},
  { id:"plankweight", name:"Weighted Plank", description:"Core stability", muscleGroup:"core", intensity:"medium", duration:300, sets:3, reps:"30-60 sec", locations:["gym"], youtube:"https://www.youtube.com/watch?v=pSHjTRCQxIw"},
  { id:"toestobar", name:"Toes to Bar", description:"Advanced core", muscleGroup:"core", intensity:"high", duration:300, sets:3, reps:"10-12", locations:["gym"], youtube:"https://www.youtube.com/watch?v=Pr1ieGZ5atk"},
  { id:"sidebend", name:"Dumbbell Side Bend", description:"Obliques", muscleGroup:"core", intensity:"low", duration:300, sets:3, reps:"12 each side", locations:["gym"], youtube:"https://www.youtube.com/watch?v=wkD8rjkodUI"},

  // 🟡 CARDIO (GYM)
  { id:"treadmill", name:"Treadmill Run", description:"Steady cardio", muscleGroup:"cardio", intensity:"medium", duration:300, sets:1, reps:"5 min", locations:["gym"], youtube:"https://www.youtube.com/watch?v=5umbf4ps0GQ"},
  { id:"bike", name:"Stationary Bike", description:"Low impact cardio", muscleGroup:"cardio", intensity:"low", duration:300, sets:1, reps:"5 min", locations:["gym"], youtube:"https://www.youtube.com/watch?v=1V6zQ4V1R9w"},
  { id:"rower", name:"Rowing Machine", description:"Full body cardio", muscleGroup:"cardio", intensity:"medium", duration:300, sets:1, reps:"5 min", locations:["gym"], youtube:"https://www.youtube.com/watch?v=3f6e3E3r8XQ"},
  { id:"stair", name:"Stair Climber", description:"Leg endurance", muscleGroup:"cardio", intensity:"medium", duration:300, sets:1, reps:"5 min", locations:["gym"], youtube:"https://www.youtube.com/watch?v=0t9l9p1p9v8"},
  { id:"elliptical", name:"Elliptical", description:"Low impact cardio", muscleGroup:"cardio", intensity:"low", duration:300, sets:1, reps:"5 min", locations:["gym"], youtube:"https://www.youtube.com/watch?v=1V6zQ4V1R9w"},
  { id:"sled", name:"Sled Push", description:"Explosive cardio", muscleGroup:"cardio", intensity:"high", duration:300, sets:3, reps:"20m", locations:["gym"], youtube:"https://www.youtube.com/watch?v=Rz0go1pTda8"},
  { id:"battle", name:"Battle Ropes", description:"Full body cardio", muscleGroup:"cardio", intensity:"high", duration:300, sets:3, reps:"30 sec", locations:["gym"], youtube:"https://www.youtube.com/watch?v=2-9bH9sF7VY"},
  { id:"ski", name:"Ski Erg", description:"Upper cardio", muscleGroup:"cardio", intensity:"medium", duration:300, sets:1, reps:"5 min", locations:["gym"], youtube:"https://www.youtube.com/watch?v=2-9bH9sF7VY"},
  { id:"spin", name:"Spin Bike", description:"HIIT cardio", muscleGroup:"cardio", intensity:"high", duration:300, sets:1, reps:"3 min", locations:["gym"], youtube:"https://www.youtube.com/watch?v=1V6zQ4V1R9w"},

  // 🟣 STRETCHING (GYM)
  { id:"hamstring", name:"Hamstring Stretch", description:"Stretch hamstrings", muscleGroup:"stretching", intensity:"low", duration:300, sets:2, reps:"30 sec", locations:["gym","home"], youtube:"https://www.youtube.com/watch?v=v1VYq2H3h2o"},
  { id:"quad", name:"Quad Stretch", description:"Stretch quads", muscleGroup:"stretching", intensity:"low", duration:300, sets:2, reps:"30 sec", locations:["gym","home"], youtube:"https://www.youtube.com/watch?v=FvQ6Vx9g6pA"},
  { id:"calf", name:"Calf Stretch", description:"Stretch calves", muscleGroup:"stretching", intensity:"low", duration:300, sets:2, reps:"30 sec", locations:["gym","home"], youtube:"https://www.youtube.com/watch?v=YMmgqO8Jo-k"},
  { id:"shoulder", name:"Shoulder Stretch", description:"Upper stretch", muscleGroup:"stretching", intensity:"low", duration:300, sets:2, reps:"30 sec", locations:["gym","home"], youtube:"https://www.youtube.com/watch?v=6jHsraw2NIk"},
  { id:"cobra", name:"Cobra Stretch", description:"Lower back stretch", muscleGroup:"stretching", intensity:"low", duration:300, sets:2, reps:"30 sec", locations:["gym","home"], youtube:"https://www.youtube.com/watch?v=JDcdhTuycOI"},
  { id:"childpose", name:"Child's Pose", description:"Recovery stretch", muscleGroup:"stretching", intensity:"low", duration:300, sets:2, reps:"30 sec", locations:["gym","home"], youtube:"https://www.youtube.com/watch?v=eqVMAPM00DM"},
  { id:"hipflexor", name:"Hip Flexor Stretch", description:"Hip mobility", muscleGroup:"stretching", intensity:"low", duration:300, sets:2, reps:"30 sec", locations:["gym","home"], youtube:"https://www.youtube.com/watch?v=7bRaX6M2nr8"},
  { id:"spine", name:"Spinal Twist", description:"Back mobility", muscleGroup:"stretching", intensity:"low", duration:300, sets:2, reps:"30 sec", locations:["gym","home"], youtube:"https://www.youtube.com/watch?v=wkD8rjkodUI"},
  { id:"neck", name:"Neck Stretch", description:"Neck mobility", muscleGroup:"stretching", intensity:"low", duration:300, sets:2, reps:"30 sec", locations:["gym","home"], youtube:"https://www.youtube.com/watch?v=2NOsE-VPpkE"},

  // 🏠 UPPER BODY (HOME)
  { id:"pushup", name:"Push-Up", description:"Chest & triceps", muscleGroup:"upper-body", intensity:"medium", duration:300, sets:3, reps:"10-15", locations:["home"], youtube:"https://www.youtube.com/watch?v=IODxDxX7oi4"},
  { id:"diamondpushup", name:"Diamond Push-Up", description:"Tricep focus", muscleGroup:"upper-body", intensity:"medium", duration:300, sets:3, reps:"8-12", locations:["home"], youtube:"https://www.youtube.com/watch?v=J0DXe9M0Fug"},
  { id:"pikepushup", name:"Pike Push-Up", description:"Shoulder press substitute", muscleGroup:"upper-body", intensity:"medium", duration:300, sets:3, reps:"8-12", locations:["home"], youtube:"https://www.youtube.com/watch?v=sposDXWEB0A"},
  { id:"dips", name:"Tricep Dips", description:"Triceps & chest", muscleGroup:"upper-body", intensity:"medium", duration:300, sets:3, reps:"10-15", locations:["home"], youtube:"https://www.youtube.com/watch?v=6kALZikXxLc"},
  { id:"dumbbellrow", name:"Dumbbell Row", description:"Back thickness at home", muscleGroup:"upper-body", intensity:"medium", duration:300, sets:3, reps:"10-12 each", locations:["home"], youtube:"https://www.youtube.com/watch?v=roCP6wCXPqo"},
  { id:"dbohp", name:"Dumbbell Overhead Press", description:"Shoulder strength", muscleGroup:"upper-body", intensity:"medium", duration:300, sets:3, reps:"10-12", locations:["home"], youtube:"https://www.youtube.com/watch?v=qEwKCR5JCog"},
  { id:"dbbicep", name:"Dumbbell Bicep Curl", description:"Bicep isolation", muscleGroup:"upper-body", intensity:"low", duration:300, sets:3, reps:"12-15", locations:["home"], youtube:"https://www.youtube.com/watch?v=ykJmrZ5v0Oo"},

  // 🏠 LOWER BODY (HOME)
  { id:"bwsquat", name:"Bodyweight Squat", description:"Quad & glute builder", muscleGroup:"lower-body", intensity:"low", duration:300, sets:3, reps:"15-20", locations:["home"], youtube:"https://www.youtube.com/watch?v=aclHkVaku9U"},
  { id:"jumpsquat", name:"Jump Squat", description:"Explosive power", muscleGroup:"lower-body", intensity:"high", duration:300, sets:3, reps:"10-15", locations:["home"], youtube:"https://www.youtube.com/watch?v=CVaEhXotL7M"},
  { id:"lunge", name:"Walking Lunge", description:"Single-leg strength", muscleGroup:"lower-body", intensity:"medium", duration:300, sets:3, reps:"12 each", locations:["home"], youtube:"https://www.youtube.com/watch?v=L8fvypPrzzs"},
  { id:"bulgariansplit", name:"Bulgarian Split Squat", description:"Unilateral leg strength", muscleGroup:"lower-body", intensity:"high", duration:300, sets:3, reps:"8-10 each", locations:["home"], youtube:"https://www.youtube.com/watch?v=2C-uNgKwPLE"},
  { id:"glutebridge", name:"Glute Bridge", description:"Hip extension & glutes", muscleGroup:"lower-body", intensity:"low", duration:300, sets:3, reps:"15-20", locations:["home"], youtube:"https://www.youtube.com/watch?v=8bbE64NuDTU"},
  { id:"dbrdl", name:"Dumbbell RDL", description:"Hamstrings at home", muscleGroup:"lower-body", intensity:"medium", duration:300, sets:3, reps:"10-12", locations:["home"], youtube:"https://www.youtube.com/watch?v=hCDzSR6bW10"},
  { id:"stepup", name:"Step-Up", description:"Functional leg strength", muscleGroup:"lower-body", intensity:"medium", duration:300, sets:3, reps:"12 each", locations:["home"], youtube:"https://www.youtube.com/watch?v=dQqApCGd5Ss"},

  // 🏠 CORE (HOME)
  { id:"plank", name:"Plank", description:"Core stability", muscleGroup:"core", intensity:"low", duration:300, sets:3, reps:"30-60 sec", locations:["home"], youtube:"https://www.youtube.com/watch?v=pSHjTRCQxIw"},
  { id:"bicyclecrunch", name:"Bicycle Crunch", description:"Obliques & abs", muscleGroup:"core", intensity:"medium", duration:300, sets:3, reps:"20-30", locations:["home"], youtube:"https://www.youtube.com/watch?v=9FGilxCbdz8"},
  { id:"mountainclimber", name:"Mountain Climbers", description:"Core + cardio", muscleGroup:"core", intensity:"high", duration:300, sets:3, reps:"30 sec", locations:["home"], youtube:"https://www.youtube.com/watch?v=nmwgirgXLYM"},
  { id:"hollowbody", name:"Hollow Body Hold", description:"Full core tension", muscleGroup:"core", intensity:"medium", duration:300, sets:3, reps:"20-30 sec", locations:["home"], youtube:"https://www.youtube.com/watch?v=hGQlb3QfFzw"},
  { id:"legrise", name:"Lying Leg Raise", description:"Lower abs", muscleGroup:"core", intensity:"medium", duration:300, sets:3, reps:"12-15", locations:["home"], youtube:"https://www.youtube.com/watch?v=Wp4BlxcFTkE"},

  // 🏠 CARDIO (HOME)
  { id:"jumpingjacks", name:"Jumping Jacks", description:"Full body warm-up cardio", muscleGroup:"cardio", intensity:"low", duration:300, sets:3, reps:"30 sec", locations:["home"], youtube:"https://www.youtube.com/watch?v=iSSAk4XCsRA"},
  { id:"burpee", name:"Burpees", description:"Full body explosive", muscleGroup:"cardio", intensity:"high", duration:300, sets:3, reps:"10-15", locations:["home"], youtube:"https://www.youtube.com/watch?v=818eSGlKdJM"},
  { id:"highknees", name:"High Knees", description:"Running in place", muscleGroup:"cardio", intensity:"high", duration:300, sets:3, reps:"30 sec", locations:["home"], youtube:"https://www.youtube.com/watch?v=ZZZoCNMU48U"},
  { id:"shadowbox", name:"Shadow Boxing", description:"Cardio & coordination", muscleGroup:"cardio", intensity:"medium", duration:300, sets:3, reps:"1 min", locations:["home"], youtube:"https://www.youtube.com/watch?v=rn5Br9CpWzc"},

  // 🎯 ACCESSORIES (~3 minutes each)
  { id:"facepull", name:"Face Pull", description:"Rear shoulder finisher", muscleGroup:"accessories", intensity:"low", duration:300, sets:3, reps:"15-20", locations:["gym"], youtube:"https://www.youtube.com/watch?v=HSoHeSjvqZc", type:"accessory"},
  { id:"armblaster", name:"Arm Blaster Curl", description:"Bicep isolation", muscleGroup:"accessories", intensity:"low", duration:300, sets:3, reps:"12-15", locations:["gym"], youtube:"https://www.youtube.com/watch?v=sfJRf84cbg8", type:"accessory"},
  { id:"flyes", name:"Cable Flyes", description:"Chest finisher", muscleGroup:"accessories", intensity:"low", duration:300, sets:3, reps:"12-15", locations:["gym"], youtube:"https://www.youtube.com/watch?v=4Y2gMDj9100", type:"accessory"},
  { id:"legcalf", name:"Calf Raises", description:"Lower leg burner", muscleGroup:"accessories", intensity:"low", duration:300, sets:3, reps:"15-20", locations:["gym"], youtube:"https://www.youtube.com/watch?v=R5YMlR6VqFU", type:"accessory"},
  { id:"absweighted", name:"Weighted Ab Crunch", description:"Core finisher", muscleGroup:"accessories", intensity:"medium", duration:300, sets:3, reps:"12-15", locations:["gym"], youtube:"https://www.youtube.com/watch?v=2fCzN6rP2cE", type:"accessory"},
  { id:"shouldershrugger", name:"Barbell Shrug", description:"Trap strengthener", muscleGroup:"accessories", intensity:"low", duration:300, sets:3, reps:"12-15", locations:["gym"], youtube:"https://www.youtube.com/watch?v=3-ygB1V4ZwU", type:"accessory"},
  { id:"tricepext", name:"Rope Tricep Extension", description:"Arm finisher", muscleGroup:"accessories", intensity:"low", duration:300, sets:3, reps:"12-15", locations:["gym"], youtube:"https://www.youtube.com/watch?v=6JK8Xp0BpFE", type:"accessory"},
  { id:"hamcurl", name:"Seated Leg Curl", description:"Leg finisher", muscleGroup:"accessories", intensity:"low", duration:300, sets:3, reps:"12-15", locations:["gym"], youtube:"https://www.youtube.com/watch?v=1Tq3QdYUuHs", type:"accessory"},
];


export function getExercisesByMuscleGroup(muscleGroup: MuscleGroup): Exercise[] {
  return exercises.filter(e => e.muscleGroup === muscleGroup);
}

export function getExercisesByIntensity(intensity: Intensity): Exercise[] {
  return exercises.filter(e => e.intensity === intensity);
}

export function getAccessories(): Exercise[] {
  return exercises.filter(e => e.type === "accessory");
}

export function getMainExercises(): Exercise[] {
  return exercises.filter(e => e.type !== "accessory");
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`;
}

export function formatTotalTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
