"use client";
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  HelpCircle,
  Home,
  Lightbulb,
  Mic,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Star,
  Target,
  Timer,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";

type Page = "dashboard" | "repository" | "day1" | "day2" | "day3" | "day4" | "participant" | "timer" | "resources" | "report";
type DayId = "day1" | "day2" | "day3" | "day4";
type Tab = "schedule" | "activities" | "guide" | "resources";
type ResourceTab = "templates" | "facilitation";
type HmwTab = "generate" | "saved" | "templates" | "guide";
type Colour = "blue" | "green" | "orange" | "purple";
type GuidanceLevel = "beginner" | "standard" | "expert";

type Activity = {
  id: string;
  title: string;
  duration: string;
  description: string;
  participants: string;
  materials: string[];
  deliverable: string;
  tips: string[];
  guideTitle: string;
  guideSubtitle: string;
};

// Returns a list of "Watch for" facilitator guidance tailored to the activity.
function getActivityWatchFors(activity: Activity) {
  const id = activity.id;
  const title = activity.title.toLowerCase();

  const specific: Record<string, string[]> = {
    kickoff: [
      "Participants unclear on the sprint challenge, roles, or what will happen today",
      "The room moving into solution mode before the problem is framed",
      "The Decider’s role not being clearly understood",
    ],

    "ltg-questions": [
      "Long-term goals becoming feature ideas instead of outcomes",
      "Sprint questions being too safe, vague, or optimistic",
      "Risks being discussed but not turned into clear questions",
    ],

    mapping: [
      "The map becoming an internal process map rather than a user journey",
      "Pain points being added without evidence, examples, or user context",
      "The team trying to solve the problem while still mapping it",
    ],

    interviews: [
      "Experts giving opinions or solutions instead of evidence and constraints",
      "Good observations not being converted into How Might We questions",
      "HMWs becoming hidden solutions rather than opportunity statements",
    ],

    target: [
      "The team choosing the most interesting area rather than the most useful sprint target",
      "Voting overriding Decider judgement without a clear rationale",
      "The selected target being too broad to prototype and test",
    ],

    lightning: [
      "Examples becoming long presentations instead of quick inspiration",
      "The team copying products rather than extracting useful patterns",
      "Useful ingredients not being captured for sketching",
    ],

    sketch: [
      "Participants discussing ideas instead of working silently",
      "People worrying about drawing quality rather than clarity",
      "Final sketches needing verbal explanation to make sense",
    ],

    "art-museum": [
      "Authors explaining or defending their sketches during silent review",
      "The team voting for polish rather than potential",
      "Strong ideas being missed because they are visually rough",
    ],

    "concept-presentations": [
      "Presentations becoming pitches rather than neutral walkthroughs",
      "Heat-map signal being ignored or over-interpreted",
      "Weaknesses and risks not being captured before voting",
    ],

    supervote: [
      "Votes reflecting personal preference rather than sprint questions",
      "The Decider choice not being recorded with rationale",
      "A wildcard idea being lost when it could strengthen the storyboard",
    ],

    "user-test-flow": [
      "Flows becoming too detailed before the core test journey is agreed",
      "Participants designing screens instead of mapping the user path",
      "Flows that do not clearly test the riskiest sprint questions",
    ],

    "user-test-flow-voting": [
      "Participants defending their own flows rather than comparing learning value",
      "The selected flow not being specific enough to storyboard",
      "The Decider choosing without capturing why",
    ],

    "storyboarding-part-1": [
      "The team adding detail before the 10-panel structure is clear",
      "Storyboard panels not following the chosen user test flow",
      "Important concept moments not being placed into the journey",
    ],

    "storyboarding-part-2": [
      "Missing transition states, confirmations, or hand-off moments",
      "The storyboard becoming too large for one-day prototyping",
      "Priority prototype screens not being marked clearly",
    ],

    planning: [
      "Prototype scope becoming too ambitious for one day",
      "Roles and ownership staying vague",
      "The team forgetting which assumptions the prototype must test",
    ],

    building: [
      "The prototype becoming too polished or too functional",
      "Placeholder content weakening the realism of the test",
      "Work drifting away from the storyboard and test goals",
    ],

    review: [
      "Review focusing on polish instead of test blockers",
      "Prototype gaps that could confuse users being left unresolved",
      "The testing script not matching the prototype flow",
    ],

    prep: [
      "Testing roles, devices, links, or consent steps not being ready",
      "Questions becoming leading or explanatory",
      "Observers being unclear on what evidence to capture",
    ],

    "testing-1": [
      "The facilitator explaining the prototype too much",
      "Observers capturing opinions but missing behaviour",
      "Early confusion not being debriefed immediately after the session",
    ],

    "testing-2": [
      "The team overreacting to one repeated issue too early",
      "Comparisons with Session 1 not being captured clearly",
      "The script drifting from the first session",
    ],

    "testing-3": [
      "Emerging patterns being accepted without enough evidence",
      "Contradictions being ignored because they complicate the story",
      "Observers forgetting to capture exact quotes",
    ],

    "testing-4": [
      "The team looking only for confirmation of earlier patterns",
      "Surprising behaviour not being explored neutrally",
      "Changing the prototype or script midstream without noting it",
    ],

    "testing-5": [
      "Final-session evidence being treated as more important because it is recent",
      "Weak signals being overstated in synthesis",
      "Recommendations being formed before all sessions are reviewed",
    ],

    analysis: [
      "The team mixing opinion, interpretation, and observed behaviour",
      "One participant’s feedback being treated as a validated pattern",
      "Insights not being turned into clear decisions or next steps",
    ],
  };

  if (specific[id]) return specific[id];

  if (title.includes("wrap")) {
    return [
      "Decisions being summarised too vaguely",
      "Open questions not being captured before people leave",
      "The next day or next step not being made clear",
    ];
  }

  return [
    "Discussion replacing individual thinking",
    "Participants jumping to solutions too early",
    "The expected output not being captured clearly",
  ];
}

type Artefact = {
  id: string;
  activityKey: string;
  type: "photo" | "note";
  name: string;
  dataUrl?: string;
  storagePath?: string;
  publicUrl?: string;
  caption: string;
  noteKind?: "insight" | "opportunity" | "parking" | "decision" | "risk" | "question" | "recommendation";
  createdAt: number;
};

const noteArtefactTypes = [
  { id: "insight", label: "Insight", icon: Lightbulb, color: "from-blue-500 to-blue-700" },
  { id: "opportunity", label: "Opportunity", icon: Target, color: "from-emerald-500 to-emerald-700" },
  { id: "parking", label: "Parking lot", icon: Star, color: "from-slate-500 to-slate-700" },
  { id: "decision", label: "Decision", icon: CheckCircle2, color: "from-purple-500 to-purple-700" },
  { id: "risk", label: "Risk", icon: Zap, color: "from-red-500 to-red-700" },
  { id: "question", label: "Question", icon: HelpCircle, color: "from-amber-500 to-amber-700" },
  { id: "recommendation", label: "Recommendation", icon: Send, color: "from-cyan-500 to-cyan-700" },
] as const;

function getNoteArtefactType(noteKind: Artefact["noteKind"]) {
  return noteArtefactTypes.find((type) => type.id === noteKind) ?? noteArtefactTypes[0];
}

type SprintDay = {
  id: DayId;
  label: string;
  title: string;
  subtitle: string;
  summary: string;
  duration: string;
  colour: Colour;
  icon: React.ElementType;
  goal: string;
  middleLabel: string;
  middle: string;
  outcome: string;
  guideLabel: string;
  schedule: Array<{ time: string; title: string; duration: string; isBreak?: boolean; activityId?: string; activityDayId?: DayId }>;
  activities: Activity[];
};

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const colour = {
  blue: { solid: "bg-blue-600 text-white", text: "text-blue-600", soft: "bg-blue-50 text-blue-700 border-blue-200", border: "border-blue-600", ring: "ring-blue-100" },
  green: { solid: "bg-emerald-600 text-white", text: "text-emerald-600", soft: "bg-emerald-50 text-emerald-700 border-emerald-200", border: "border-emerald-600", ring: "ring-emerald-100" },
  orange: { solid: "bg-orange-600 text-white", text: "text-orange-600", soft: "bg-orange-50 text-orange-700 border-orange-200", border: "border-orange-600", ring: "ring-orange-100" },
  purple: { solid: "bg-purple-600 text-white", text: "text-purple-600", soft: "bg-purple-50 text-purple-700 border-purple-200", border: "border-purple-600", ring: "ring-purple-100" },
};

const DAY_IDS: DayId[] = ["day1", "day2", "day3", "day4"];

function dayLabel(dayId: DayId) {
  return `Day ${dayId.replace("day", "")}`;
}

function activityKey(dayId: DayId, activityId: string) {
  return `${dayId}-${activityId}`;
}

function createClientId(prefix = "id") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function sprintProgressFillStyle(percent: number): React.CSSProperties {
  const safePercent = Math.max(0, Math.min(100, percent));

  return {
    width: safePercent === 0 ? "0%" : `${safePercent}%`,
    background:
      "linear-gradient(90deg, #3b82f6 0%, #3b82f6 18.75%, #10b981 31.25%, #10b981 43.75%, #f97316 56.25%, #f97316 68.75%, #a855f7 81.25%, #a855f7 100%)",
    backgroundSize: safePercent === 0 ? "100% 100%" : `${10000 / safePercent}% 100%`,
    backgroundRepeat: "no-repeat",
  };
}

const day1Activities: Activity[] = [
  { id: "kickoff", title: "Sprint Kickoff", duration: "30 min", description: "Set the stage, align the team, and establish ground rules for the sprint.", participants: "All team members", materials: ["Agenda", "Sprint canvas", "Name tags"], deliverable: "Aligned team with clear sprint goals", tips: ["Start with introductions if needed", "Communicate the sprint format and expectations", "Create a parking lot for off-topic discussion"], guideTitle: "Sprint Planning & Preparation Guide", guideSubtitle: "Complete guide for setting up and preparing your design sprint for maximum success" },
  {
    id: "ltg-questions",
    title: "Long Term Goal and Sprint Questions",
    duration: "55 min",
    description:
      "The team individually creates long-term goals and pessimistic sprint questions to clarify what success looks like and what risks could prevent it.",
    participants: "All team members",
    materials: ["Sticky notes", "Markers", "Timer"],
    deliverable:
      "A set of long-term goals and critical sprint questions that frame success and risk for the sprint.",
    tips: [
      "Ask participants to work individually before sharing",
      "Encourage measurable long-term goals where possible",
      "Frame sprint questions pessimistically to expose real risks",
      "Capture both goals and questions visibly for the rest of the sprint",
    ],
    guideTitle: "Long Term Goal and Sprint Questions",
    guideSubtitle:
      "How to define long-term success and turn uncertainty into useful sprint questions",
  },
  { id: "mapping", title: "Problem Mapping", duration: "35 min", description: "This is essential to create a shared mental model. It maps the current, often flawed, state of affairs. It forces the team to agree on a specific target area.", participants: "All team members", materials: ["Large sheets of paper", "Sticky notes", "Markers", "Timer"], deliverable: "Complete user journey map with pain points identified", tips: ["Focus on the user journey, not internal processes", "Separate assumptions from known facts", "Keep the map visible throughout the sprint"], guideTitle: "Problem Mapping Facilitation Guide", guideSubtitle: "How to facilitate effective problem mapping sessions to understand the challenge landscape" },
  {
    id: "interviews",
    title: "Expert Interviews & How Might We",
    duration: "45 min",
    description:
      "Gather insight from people who understand the problem, users, operations, or constraints, then immediately convert the strongest observations into How Might We opportunities.",
    participants: "Experts + sprint team",
    materials: ["Interview questions", "Note sheets", "Sticky notes", "Markers", "Timer"],
    deliverable: "Key insights, assumptions, constraints, and How Might We questions captured",
    tips: [
      "Ask open questions and listen for evidence, contradictions, constraints, and assumptions",
      "Capture direct quotes and important observations where useful",
      "Turn useful insights into How Might We questions while they are fresh",
      "Start each opportunity with ‘How might we…’ and avoid embedding solutions too early",
      "Cluster related HMWs so they can support target selection later",
    ],
    guideTitle: "Expert Interview Facilitation Guide",
    guideSubtitle: "How to gather expert insight and convert it into useful How Might We opportunities",
  },
  { id: "target", title: "Target Selection", duration: "30 min", description: "Choose the most important challenge or opportunity to focus on for the sprint.", participants: "All team members", materials: ["Voting dots", "Decision matrix", "Timer"], deliverable: "One target problem or opportunity selected", tips: ["Consider impact vs effort", "The Decider has the final say", "Choose something that can be prototyped and tested"], guideTitle: "Voting & Decision Framework", guideSubtitle: "Structured approach for making decisions and selecting targets" },
  {
    id: "lightning",
    title: "Lightning Demos",
    duration: "35 min",
    description: "Quick presentations of existing solutions and inspiration from other industries to gather useful patterns before sketching.",
    participants: "All team members",
    materials: ["Examples", "Sticky notes", "Markers", "Timer"],
    deliverable: "Collection of inspiring solutions, patterns, and reusable ingredients",
    tips: ["Focus on useful patterns, not copying whole products", "Keep examples short", "Capture the ingredient that makes each example useful", "Look outside your sector for inspiration"],
    guideTitle: "Lightning Demos & Sketching Guide",
    guideSubtitle: "How to inspire ideas and move into structured sketching",
  },
  {
    id: "sketch",
    title: "Four-Step Sketch (Break included)",
    duration: "95 min",
    description: "Individual sketching exercise to generate detailed solution ideas using notes, ideas, Crazy 8s, and a final self-explanatory sketch, with a short break included in the timebox.",
    participants: "All team members",
    materials: ["Paper", "Markers", "Timer", "Sketching templates"],
    deliverable: "Individual solution sketches from each team member",
    tips: ["Work silently", "Prioritise clarity over drawing quality", "Make sketches understandable without a pitch", "Use annotations and steps", "Use the included break to reset before finishing the final sketch"],
    guideTitle: "Lightning Demos & Sketching Guide",
    guideSubtitle: "How to run silent sketching and produce self-explanatory concepts",
  },
  {
    id: "wrap-up",
    title: "Day 1 Wrap-up",
    duration: "30 min",
    description: "Recap key decisions, confirm the selected target, capture open questions, and preview Day 2.",
    participants: "All team members",
    materials: ["Notes", "Sprint wall", "Timer"],
    deliverable: "Confirmed Day 1 decisions, target, and open questions",
    tips: [
      "Summarise what has been decided",
      "Confirm the target clearly",
      "Capture any risks or unanswered questions",
      "Preview what happens on Day 2"
    ],
    guideTitle: "Day Opening & Closing Scripts",
    guideSubtitle: "How to close the day clearly and maintain momentum into Day 2",
  },
];

const day2Activities: Activity[] = [
  {
    id: "kickoff",
    title: "Day 2 Welcome Back",
    duration: "15 min",
    description: "Recap the Day 1 target, explain how the team will move from problem understanding to solution ideas, and set expectations for silent sketching and decision-making.",
    participants: "All team members",
    materials: ["Sprint target", "Day 1 outputs", "Timer"],
    deliverable: "Shared understanding of the Day 2 goal and decision flow",
    tips: ["Keep the recap tight", "Restate the selected target", "Explain that sketches will be judged on clarity and potential, not drawing skill", "Remind the Decider they will make the final call"],
    guideTitle: "Day Opening & Closing Scripts",
    guideSubtitle: "Ready-to-use wording for opening each sprint day and setting expectations",
  },
  {
    id: "art-museum",
    title: "Art Gallery",
    duration: "30 min",
    description: "Display solution sketches silently so the team can review ideas without pitches, discussion, or hierarchy influencing judgement.",
    participants: "All team members",
    materials: ["Completed sketches", "Wall space", "Tape", "Voting dots"],
    deliverable: "All solution sketches reviewed silently and ready for critique",
    tips: ["Keep the room silent", "Let sketches speak for themselves", "Encourage people to look for strengths and patterns", "Do not allow authors to explain their work yet"],
    guideTitle: "Voting & Decision Framework",
    guideSubtitle: "How to review sketches, identify signal, and prepare for decision-making",
  },
  {
    id: "concept-presentations",
    title: "Concept Presentations",
    duration: "25 min",
    description:
      "A single presenter, usually the facilitator, walks the team through the heat map results and the strongest areas of interest before voting begins.",
    participants: "Facilitator + full sprint team",
    materials: ["Displayed sketches", "Heat map dots", "Timer", "Sprint questions"],
    deliverable: "Shared understanding of the strongest concept areas before the straw poll and Decider vote",
    tips: [
      "Use one neutral presenter to avoid authors pitching their own ideas",
      "Focus on the parts of each concept that attracted heat map attention",
      "Keep the walkthrough concise and evidence-based",
      "Connect promising ideas back to the Sprint Questions",
    ],
    guideTitle: "Voting & Decision Framework",
    guideSubtitle: "How to present heat map signal before structured voting and Decider choice",
  },
  {
    id: "supervote",
    title: "Straw Poll & Decider Vote",
    duration: "25 min",
    description:
      "Use a structured straw poll to surface the team’s preferred concept, then give the Decider the final starred votes based on which idea best answers the Sprint Questions.",
    participants: "Full sprint team + Decider",
    materials: ["Displayed sketches", "Large voting dots", "Starred Decider dots", "Markers", "Sprint Questions", "Timer"],
    deliverable: "Winning concept selected for prototyping with clear team signal and Decider rationale",
    tips: [
      "Give each person one large dot for the straw poll and ask them to add their initials",
      "Ask participants to vote for the concept they believe best answers the Sprint Questions",
      "Give the Decider two large starred dots for the final decision",
      "If the Decider needs discussion time, combine this with a short coffee break",
      "Capture the final rationale and any risks to test during prototyping",
    ],
    guideTitle: "Voting & Decision Framework",
    guideSubtitle: "How to move from team signal to Decider-led concept selection",
  },
  {
    id: "user-test-flow",
    title: "User Test Flow",
    duration: "25 min",
    description:
      "Create rough end-to-end user test flows individually using a 123/ABC wall matrix so the team can compare different approaches before storyboarding.",
    participants: "All team members",
    materials: ["123/ABC wall matrix", "Post-it notes", "Markers", "Timer"],
    deliverable: "Individual rough user test flows using six post-its per participant",
    tips: [
      "Create a clear 123/ABC wall matrix before the activity starts",
      "Give each participant six post-its only to keep flows focused",
      "Ask participants to work individually before any discussion",
      "Focus on the user journey rather than detailed screens or interface elements",
    ],
    guideTitle: "User Test Flow & Storyboarding Guide",
    guideSubtitle: "How to define the test journey before building the storyboard",
  },
  {
    id: "user-test-flow-voting",
    title: "User Test Flow Presentations & Voting",
    duration: "30 min",
    description:
      "Participants quickly present their proposed user test flows, then the team votes and the Decider selects the primary flow plus a wildcard option.",
    participants: "All team members + Decider",
    materials: ["123/ABC wall matrix", "Voting dots", "Decider dots", "Markers", "Timer"],
    deliverable: "Selected user test flow and wildcard option ready for storyboarding",
    tips: [
      "Keep each presentation short and focused on the flow",
      "Give each person one dot to vote for their preferred user test flow",
      "Ask people to vote based on what best answers the Sprint Questions",
      "Give the Decider two dots to choose the main flow and one wildcard direction",
      "Capture the rationale so the team understands what is moving into storyboarding",
    ],
    guideTitle: "Voting & Decision Framework",
    guideSubtitle: "How to move from several user test flow options into one Decider-led storyboard direction",
  },
  {
    id: "storyboarding-part-1",
    title: "Storyboarding Part 1",
    duration: "55 min",
    description:
      "Create the first version of the storyboard by setting up 10 panels, aligning the chosen user test flow, walking through the rough story, and moving concept sketches into the flow to fill the major gaps.",
    participants: "Full sprint team",
    materials: ["Storyboard panels", "Selected user test flow post-its", "Concept sketches", "Markers", "Sticky notes", "Timer"],
    deliverable: "Rough storyboard structure with the chosen user test flow and key concept sketches placed into the panels",
    tips: [
      "First, create 10 panels and align the chosen user test flow post-its into the storyboard",
      "Walk through the rough story before adding too much detail",
      "Move in sketches from concepts to fill gaps and strengthen the flow",
      "Start discussing the target test group while shaping the storyboard",
      "Keep this pass focused on structure, sequence, and major moments rather than polish",
    ],
    guideTitle: "User Test Flow & Storyboarding Guide",
    guideSubtitle: "How to build the first-pass storyboard from the selected user test flow",
  },
  {
    id: "storyboarding-part-2",
    title: "Storyboarding Part 2",
    duration: "55 min",
    description:
      "Complete the storyboard by filling in all remaining details, adding important in-between states, walking through the finished story, and marking the highest-priority screens for prototyping.",
    participants: "Full sprint team",
    materials: ["Storyboard panels", "Concept sketches", "Markers", "Sticky notes", "Timer"],
    deliverable: "Finished storyboard with priority prototype screens clearly marked",
    tips: [
      "Fill in all important details needed for the prototype team to build confidently",
      "Pay attention to in-between states, transitions, confirmations, and hand-offs",
      "Walk through the finished storyboard from the user’s point of view",
      "Mark high-priority screens that must be built if time becomes tight",
      "Capture any remaining assumptions or prototype risks before moving on",
    ],
    guideTitle: "User Test Flow & Storyboarding Guide",
    guideSubtitle: "How to complete the storyboard and prioritise the prototype screens",
  },
  {
    id: "day2-wrap",
    title: "Day 2 Wrap-up",
    duration: "15 min",
    description:
      "Review everything achieved across the first two days, explain how the team arrived at the solution to test, and prepare everyone for prototyping and user testing.",
    participants: "All team members",
    materials: ["Sprint wall", "Selected user test flow", "Storyboard", "Concept outputs", "Timer"],
    deliverable: "Shared understanding of the chosen solution, storyboard, and next steps for prototyping and testing",
    tips: [
      "Recap the journey from challenge to selected solution",
      "Connect the storyboard back to the Sprint Questions",
      "Explain what happens over the next two days: prototyping then user testing",
      "Confirm any preparation needed before Day 3 begins",
    ],
    guideTitle: "Day Opening & Closing Scripts",
    guideSubtitle: "How to close Day 2 clearly and set up the transition into prototyping and testing",
  },
];

const day3Activities: Activity[] = [
  {
    id: "planning",
    title: "Prototype Planning",
    duration: "45 min",
    description: "Plan the prototype structure, fidelity, roles, tools, and responsibilities before building starts.",
    participants: "Prototype team",
    materials: ["Prototype plan", "Role list", "Storyboard", "Timer"],
    deliverable: "Prototype plan with clear responsibilities",
    tips: ["Assign a stitcher or integrator", "Use realistic content", "Decide what can be faked", "Protect review time before the end of the day"],
    guideTitle: "Prototyping Guide",
    guideSubtitle: "How to choose fidelity, assign roles, and avoid overbuilding",
  },
  {
    id: "building",
    title: "Prototype Building",
    duration: "5 hours",
    description: "Build a realistic-enough prototype that users can react to during testing.",
    participants: "Prototype team",
    materials: ["Prototype tools", "Assets", "Content", "Storyboard", "Timer"],
    deliverable: "Realistic prototype ready for review",
    tips: ["Build the illusion, not the system", "Avoid perfectionism", "Keep checking against the test question", "Use realistic names, content, and data"],
    guideTitle: "Prototyping Guide",
    guideSubtitle: "How to build a realistic prototype in one day",
  },
  {
    id: "review",
    title: "Prototype Review",
    duration: "45 min",
    description: "Review the prototype against the storyboard and test goals, then fix anything that would block a useful user test.",
    participants: "Prototype team + facilitator",
    materials: ["Prototype", "Storyboard", "Testing script", "Issue list"],
    deliverable: "Prototype checked and ready for Day 4 testing",
    tips: ["Run through the prototype as a user", "Fix blockers before polish", "Check that the test script matches the prototype", "Capture remaining risks"],
    guideTitle: "User Testing Guide",
    guideSubtitle: "How to prepare the prototype and test flow before user sessions",
  },
];

const day4Activities: Activity[] = [
  {
    id: "prep",
    title: "Test Preparation",
    duration: "75 min",
    description: "Prepare for user testing sessions — scripts, logistics, prototype access, consent, note-taking, and roles.",
    participants: "Facilitator + testing team",
    materials: ["Testing script", "Prototype", "Consent wording", "Observation sheet"],
    deliverable: "Ready testing environment and materials",
    tips: ["Check links and devices", "Assign interviewer and note-taker", "Use neutral wording", "Prepare backup plans"],
    guideTitle: "User Testing Guide",
    guideSubtitle: "How to prepare scripts, roles, and logistics for user testing",
  },
  {
    id: "testing-1",
    title: "Session 1",
    duration: "45 min",
    description: "Run the first individual user test with the prototype and capture behaviour, reactions, confusion, and evidence.",
    participants: "User + interviewer + observers",
    materials: ["Prototype", "Testing script", "Observation notes"],
    deliverable: "Session 1 observations and quotes captured",
    tips: ["Start neutrally", "Watch behaviour more than opinion", "Do not explain too much", "Debrief immediately after"],
    guideTitle: "User Testing Guide",
    guideSubtitle: "How to run neutral user testing sessions and capture evidence",
  },
  {
    id: "testing-2",
    title: "Session 2",
    duration: "45 min",
    description: "Run the second individual user test and look for early repeated patterns or contradictions.",
    participants: "User + interviewer + observers",
    materials: ["Prototype", "Testing script", "Observation notes"],
    deliverable: "Session 2 observations and emerging signals captured",
    tips: ["Keep the script consistent", "Avoid leading questions", "Capture exact quotes", "Note behaviour patterns"],
    guideTitle: "User Testing Guide",
    guideSubtitle: "How to run neutral user testing sessions and capture evidence",
  },
  {
    id: "testing-3",
    title: "Session 3",
    duration: "45 min",
    description: "Run the third individual user test and continue capturing evidence against the sprint questions.",
    participants: "User + interviewer + observers",
    materials: ["Prototype", "Testing script", "Observation notes"],
    deliverable: "Session 3 observations and evidence captured",
    tips: ["Keep observers quiet", "Watch for hesitation", "Separate evidence from interpretation", "Debrief before moving on"],
    guideTitle: "User Testing Guide",
    guideSubtitle: "How to run neutral user testing sessions and capture evidence",
  },
  {
    id: "testing-4",
    title: "Session 4",
    duration: "45 min",
    description: "Run the fourth individual user test and check whether earlier patterns continue or weaken.",
    participants: "User + interviewer + observers",
    materials: ["Prototype", "Testing script", "Observation notes"],
    deliverable: "Session 4 observations and pattern checks captured",
    tips: ["Compare against earlier signals", "Stay neutral", "Capture surprises", "Avoid changing the prototype mid-test unless essential"],
    guideTitle: "User Testing Guide",
    guideSubtitle: "How to run neutral user testing sessions and capture evidence",
  },
  {
    id: "testing-5",
    title: "Session 5",
    duration: "45 min",
    description: "Run the final individual user test and capture final evidence before synthesis.",
    participants: "User + interviewer + observers",
    materials: ["Prototype", "Testing script", "Observation notes"],
    deliverable: "Session 5 observations and final testing evidence captured",
    tips: ["Do not over-correct based on one user", "Capture final quotes", "Note repeated themes", "Prepare for synthesis"],
    guideTitle: "User Testing Guide",
    guideSubtitle: "How to run neutral user testing sessions and capture evidence",
  },
  {
    id: "analysis",
    title: "Results Analysis",
    duration: "60 min",
    description: "Look for patterns, validated assumptions, warning signs, and next steps from the user testing evidence.",
    participants: "Full sprint team",
    materials: ["Testing notes", "Prototype", "Insight board", "Markers"],
    deliverable: "Validated learning and recommended next actions",
    tips: ["Group observations into patterns", "Separate behaviour from opinion", "Name confidence levels", "Turn findings into decisions or next steps"],
    guideTitle: "Synthesis & Insight Capture",
    guideSubtitle: "How to turn testing observations into evidence, decisions, and next steps",
  },
];

const sprintDays: SprintDay[] = [
  {
    id: "day1",
    label: "Day 1",
    title: "Day 1: Define & Create",
    subtitle: "Define the challenge, surface opportunities, and create solution concepts",
    summary: "Frame the challenge, surface risks and opportunities, gather expert insight, and generate solution concepts that can move into decision-making.",
    duration: "6-8 hours",
    colour: "blue",
    icon: Target,
    goal: "Frame the challenge and generate strong solution directions",
    middleLabel: "Team",
    middle: "5-7 people including Decider",
    outcome: "Challenge framed and solution concepts created",
    guideLabel: "Define & Create Guide",
    schedule: [
      { time: "9:30 AM", title: "Sprint Kickoff", duration: "30 min", activityId: "kickoff" },
      { time: "10:00 AM", title: "Problem Mapping", duration: "35 min", activityId: "mapping" },
      { time: "10:35 AM", title: "Expert Interviews & HMWs", duration: "45 min", activityId: "interviews" },
      { time: "11:20 AM", title: "Break", duration: "15 min", isBreak: true },
      { time: "11:35 AM", title: "Long Term Goal and Sprint Questions", duration: "55 min", activityId: "ltg-questions" },
      { time: "12:30 PM", title: "Target Selection", duration: "30 min", activityId: "target" },
      { time: "1:00 PM", title: "Lunch", duration: "45 min", isBreak: true },
      { time: "1:45 PM", title: "Lightning Demos", duration: "30 min", activityId: "lightning" },
      { time: "2:15 PM", title: "Four-Step Sketch (Break included)", duration: "95 min", activityId: "sketch" },
      { time: "3:50 PM", title: "Day 1 Wrap-up", duration: "30 min", activityId: "wrap-up" },
    ],
    activities: day1Activities,
  },
  {
    id: "day2",
    label: "Day 2",
    title: "Day 2: Decide & Storyboard",
    subtitle: "Choose the strongest direction and turn it into a testable storyboard",
    summary: "Review solution concepts, select the strongest direction, define the user test flow, and build a storyboard ready for prototyping.",
    duration: "6-8 hours",
    colour: "green",
    icon: Lightbulb,
    goal: "Select the solution and define the user test flow",
    middleLabel: "Focus",
    middle: "Group decision-making then storyboard detail",
    outcome: "Storyboard ready for prototyping",
    guideLabel: "Decision & Storyboard Guide",
    schedule: [
      { time: "9:30 AM", title: "Day 2 Welcome Back", duration: "15 min", activityId: "kickoff" },
      { time: "9:45 AM", title: "Art Gallery", duration: "30 min", activityId: "art-museum" },
      { time: "10:15 AM", title: "Concept Presentations", duration: "25 min", activityId: "concept-presentations" },
      { time: "10:40 AM", title: "Straw Poll & Decider Vote", duration: "25 min", activityId: "supervote" },
      { time: "11:05 AM", title: "User Test Flow", duration: "25 min", activityId: "user-test-flow" },
      { time: "11:30 AM", title: "User Test Flow Presentations & Voting", duration: "30 min", activityId: "user-test-flow-voting" },
      { time: "12:00 PM", title: "Lunch", duration: "60 min", isBreak: true },
      { time: "1:00 PM", title: "Storyboarding Part 1", duration: "55 min", activityId: "storyboarding-part-1" },
      { time: "1:55 PM", title: "Break", duration: "15 min", isBreak: true },
      { time: "2:10 PM", title: "Storyboarding Part 2", duration: "55 min", activityId: "storyboarding-part-2" },
      { time: "3:05 PM", title: "Day 2 Wrap-up", duration: "15 min", activityId: "day2-wrap" },
    ],
    activities: day2Activities,
  },
  {
    id: "day3",
    label: "Day 3",
    title: "Day 3: Prototype",
    subtitle: "Build a realistic prototype of your solution",
    summary: "Plan and build a realistic prototype focused on the critical journey that users will test on Day 4.",
    duration: "6-8 hours",
    colour: "orange",
    icon: Wrench,
    goal: "Create a testable prototype",
    middleLabel: "Approach",
    middle: "Divide and conquer with roles",
    outcome: "Ready-to-test prototype",
    guideLabel: "Prototyping Guide",
    schedule: [
      { time: "9:00 AM", title: "Prototype Planning", duration: "45 min", activityId: "planning" },
      { time: "9:45 AM", title: "Prototype Building", duration: "5 hours", activityId: "building" },
      { time: "2:45 PM", title: "Prototype Review", duration: "45 min", activityId: "review" },
    ],
    activities: day3Activities,
  },
  {
    id: "day4",
    label: "Day 4",
    title: "Day 4: Test & Validate",
    subtitle: "Test with real users and gather feedback",
    summary: "Run user testing sessions, capture behavioural evidence, identify patterns, and define validated next steps and recommendations.",
    duration: "4-6 hours",
    colour: "purple",
    icon: Zap,
    goal: "Validate solution with real users",
    middleLabel: "Users",
    middle: "5 individual testing sessions",
    outcome: "Validated insights & next steps",
    guideLabel: "Testing Guide",
    schedule: [
      { time: "9:00 AM", title: "Test Preparation", duration: "75 min", activityId: "prep" },
      { time: "10:15 AM", title: "Session 1", duration: "45 min", activityId: "testing-1" },
      { time: "11:15 AM", title: "Session 2", duration: "45 min", activityId: "testing-2" },
      { time: "12:15 PM", title: "Session 3", duration: "45 min", activityId: "testing-3" },
      { time: "1:00 PM", title: "Lunch", duration: "60 min", isBreak: true },
      { time: "2:15 PM", title: "Session 4", duration: "45 min", activityId: "testing-4" },
      { time: "3:15 PM", title: "Session 5", duration: "45 min", activityId: "testing-5" },
      { time: "4:00 PM", title: "Results Analysis", duration: "60 min", activityId: "analysis" },
    ],
    activities: day4Activities,
  },
];

type ResourceGuide = {
  title: string;
  description: string;
  stage: string;
  audience: string;
  time: string;
  kind: "Playbook" | "Guide" | "Script" | "Template" | "Troubleshooting";
  icon: React.ElementType;
};

type GuideContent = {
  summary: string;
  useWhen: string[];
  steps: Array<{ title: string; detail: string }>;
  facilitatorPrompts: string[];
  checklist: string[];
  watchouts: string[];
  outputs: string[];
};

const resourceCategories: Array<{ title: string; description: string; guides: ResourceGuide[] }> = [
  {
    title: "Foundations",
    description: "Everything a new facilitator needs before the sprint starts.",
    guides: [
      {
        title: "What is a 4-Day Design Sprint?",
        description: "A simple overview of the sprint model, what each day is for, and what good outcomes look like.",
        stage: "Before the sprint",
        audience: "New facilitators",
        time: "10 min read",
        kind: "Guide",
        icon: BookOpen,
      },
      {
        title: "Sprint Setup & Logistics Guide",
        description: "How to choose the challenge, recruit the team, prepare the room, gather materials, and brief stakeholders.",
        stage: "Preparation",
        audience: "Facilitator + sponsor",
        time: "30-60 min prep",
        kind: "Playbook",
        icon: Settings,
      },
      {
        title: "Roles & Responsibilities",
        description: "Clear expectations for the Facilitator, Decider, sprint team, experts, note-takers, and testers.",
        stage: "Preparation",
        audience: "Whole team",
        time: "10 min read",
        kind: "Guide",
        icon: Users,
      },
    ],
  },
  {
    title: "Run the Sprint",
    description: "The end-to-end operating system for facilitating the room.",
    guides: [
      {
        title: "Sprint Facilitation Playbook",
        description: "The core guide for running the sprint live: pacing, room control, activity flow, decision moments, and daily rhythm.",
        stage: "All days",
        audience: "Facilitator",
        time: "Use live",
        kind: "Playbook",
        icon: Play,
      },
      {
        title: "Day Opening & Closing Scripts",
        description: "Ready-to-use wording for opening each day, setting expectations, recapping progress, and closing the room.",
        stage: "All days",
        audience: "Facilitator",
        time: "Use live",
        kind: "Script",
        icon: Mic,
      },
      {
        title: "Transitions & Instructions Library",
        description: "What to say between activities so participants understand the task, the timebox, and the output expected.",
        stage: "All days",
        audience: "Facilitator",
        time: "Use live",
        kind: "Script",
        icon: Send,
      },
    ],
  },
  {
    title: "Sprint Techniques",
    description: "Activity-specific guidance for the core sprint methods.",
    guides: [
      {
        title: "Problem Mapping Facilitation Guide",
        description: "How to map the user journey, identify pain points, and avoid jumping too early into solutions.",
        stage: "Day 1",
        audience: "Full sprint team",
        time: "60 min",
        kind: "Guide",
        icon: Target,
      },
      {
        title: "Expert Interview Guide",
        description: "How to brief experts, ask useful questions, capture signals, and turn answers into opportunities.",
        stage: "Day 1",
        audience: "Experts + team",
        time: "90 min",
        kind: "Guide",
        icon: Users,
      },
      {
        title: "How Might We Workshop Guide",
        description: "How to convert problems and insights into better HMW questions, including examples and quality checks.",
        stage: "Day 1",
        audience: "Full sprint team",
        time: "45 min",
        kind: "Guide",
        icon: HelpCircle,
      },
      {
        title: "Long Term Goal and Sprint Questions",
        description: "How to define long-term success and turn uncertainty into useful sprint questions before target selection.",
        stage: "Day 1",
        audience: "Full sprint team",
        time: "55 min",
        kind: "Guide",
        icon: Target,
      },
      {
        title: "User Test Flow & Storyboarding Guide",
        description: "How to select the user test flow, turn it into storyboard panels, and prioritise screens for prototyping.",
        stage: "Day 2",
        audience: "Full sprint team",
        time: "2-3 hours",
        kind: "Guide",
        icon: Wrench,
      },
      {
        title: "Lightning Demos & Sketching Guide",
        description: "How to inspire ideas, run silent sketching, use Crazy 8s, and produce self-explanatory solution sketches.",
        stage: "Day 2",
        audience: "Full sprint team",
        time: "2-3 hours",
        kind: "Guide",
        icon: Lightbulb,
      },
      {
        title: "Voting & Decision Framework",
        description: "How to run dot voting, straw polls, critique, and Decider supervotes without losing momentum.",
        stage: "Day 2",
        audience: "Facilitator + Decider",
        time: "45-90 min",
        kind: "Guide",
        icon: CheckCircle2,
      },
      {
        title: "Prototyping Guide",
        description: "How to decide prototype fidelity, assign roles, use realistic content, and avoid overbuilding.",
        stage: "Day 3",
        audience: "Prototype team",
        time: "Full day",
        kind: "Guide",
        icon: Wrench,
      },
      {
        title: "User Testing Guide",
        description: "How to prepare scripts, run neutral sessions, observe behaviour, and capture reliable feedback.",
        stage: "Day 4",
        audience: "Facilitator + note-taker",
        time: "5 sessions",
        kind: "Guide",
        icon: Eye,
      },
    ],
  },
  {
    title: "Facilitation Skills",
    description: "Practical help for managing people, energy, conflict, and momentum.",
    guides: [
      {
        title: "Room Dynamics & Participation",
        description: "How to manage dominant voices, bring quiet people in, prevent groupthink, and maintain psychological safety.",
        stage: "All days",
        audience: "Facilitator",
        time: "Use live",
        kind: "Guide",
        icon: Users,
      },
      {
        title: "Energy, Pacing & Timeboxing",
        description: "How to keep the room moving, call time confidently, handle breaks, and recover when activities overrun.",
        stage: "All days",
        audience: "Facilitator",
        time: "Use live",
        kind: "Guide",
        icon: Timer,
      },
      {
        title: "Handling Conflict & Disagreement",
        description: "How to deal with challenge, disagreement, stakeholder tension, and difficult decision points constructively.",
        stage: "All days",
        audience: "Facilitator + Decider",
        time: "Use live",
        kind: "Guide",
        icon: Zap,
      },
    ],
  },
  {
    title: "Outputs & Reporting",
    description: "Turn messy sprint-wall activity into evidence, decisions, and a useful report.",
    guides: [
      {
        title: "Artefact Capture Guide",
        description: "How to photograph sprint walls, label outputs, theme notes, and capture evidence during live activities.",
        stage: "All days",
        audience: "Facilitator + note-taker",
        time: "Use live",
        kind: "Guide",
        icon: Download,
      },
      {
        title: "Synthesis & Insight Capture",
        description: "How to cluster notes, identify patterns, separate evidence from opinion, and turn findings into decisions.",
        stage: "Day 4 + after",
        audience: "Full sprint team",
        time: "60-90 min",
        kind: "Guide",
        icon: Star,
      },
      {
        title: "Sprint Report & Next Steps",
        description: "How to present outcomes, explain test evidence, recommend next actions, and brief stakeholders after the sprint.",
        stage: "After sprint",
        audience: "Facilitator + sponsor",
        time: "30-60 min",
        kind: "Template",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Troubleshooting",
    description: "What to do when the sprint gets messy, political, slow, or uncertain.",
    guides: [
      {
        title: "What If Things Go Wrong?",
        description: "Practical responses for common sprint problems: running late, weak ideas, disagreement, missing Decider, and unclear evidence.",
        stage: "All days",
        audience: "Facilitator",
        time: "Use live",
        kind: "Troubleshooting",
        icon: HelpCircle,
      },
      {
        title: "Remote & Hybrid Sprint Adjustments",
        description: "How to adapt facilitation, artefact capture, participation, testing, and decision-making for remote or hybrid groups.",
        stage: "Optional",
        audience: "Facilitator",
        time: "Use as needed",
        kind: "Guide",
        icon: Bot,
      },
    ],
  },
];

const resourceTemplateCards = [
  "Sprint Canvas",
  "Problem Map Template",
  "Expert Interview Script",
  "How Might We Worksheet",
  "Voting Board",
  "Storyboard Template",
  "Prototype Plan",
  "User Testing Script",
  "Report Template",
];

function allResourceGuides() {
  return resourceCategories.flatMap((category) => category.guides);
}

function getGuideByTitle(title: string) {
  const aliases: Record<string, string> = {
    // Day 1 mappings and related
    "Sprint Planning & Preparation Guide": "Sprint Setup & Logistics Guide",
    "How to frame long-term outcomes and identify the key risks the sprint needs to answer": "Long Term Goal and Sprint Questions",
    "How to define long-term success and turn uncertainty into useful sprint questions": "Long Term Goal and Sprint Questions",
    "How to define the user journey that the storyboard and prototype will need to support": "User Test Flow & Storyboarding Guide",
    "How to create the first-pass storyboard structure before filling in detailed prototype states": "User Test Flow & Storyboarding Guide",
    "How to complete the storyboard and identify the most important screens for prototyping": "User Test Flow & Storyboarding Guide",
    "How to define the test journey before building the storyboard": "User Test Flow & Storyboarding Guide",
    "How to build the first-pass storyboard from the selected user test flow": "User Test Flow & Storyboarding Guide",
    "How to complete the storyboard and prioritise the prototype screens": "User Test Flow & Storyboarding Guide",
    "Problem Mapping Facilitation Guide": "Problem Mapping Facilitation Guide",
    "Expert Interview Facilitation Guide": "Expert Interview Guide",
    "How Might We Workshop Guide": "How Might We Workshop Guide",
    "Voting & Decision Framework": "Voting & Decision Framework",
    "Prototyping Guide": "Prototyping Guide",
    "User Testing Preparation Guide": "User Testing Guide",
    "User Testing Facilitation Guide": "User Testing Guide",
    "Test Results Analysis Guide": "Synthesis & Insight Capture",
    "Sprint Validation Framework": "Sprint Report & Next Steps",
    "Sketching Guide": "Lightning Demos & Sketching Guide",
    "Testing Guide": "User Testing Guide",
  };

  const resolvedTitle = aliases[title] ?? title;
  return allResourceGuides().find((guide) => guide.title === resolvedTitle) ?? null;
}

function getDayAndActivityFromKey(key: string) {
  for (const day of sprintDays) {
    for (const activity of day.activities) {
      if (activityKey(day.id, activity.id) === key) return { day, activity };
    }
  }
  return null;
}

function getActivityForScheduleItem(day: SprintDay, item: SprintDay["schedule"][number]) {
  if (item.isBreak) return null;

  if (item.activityId) {
    const sourceDay = item.activityDayId
      ? sprintDays.find((candidate) => candidate.id === item.activityDayId)
      : day;

    const activity = sourceDay?.activities.find((candidate) => candidate.id === item.activityId);
    if (activity && sourceDay) return { day: sourceDay, activity };

    const fallback = sprintDays
      .flatMap((candidateDay) => candidateDay.activities.map((candidateActivity) => ({ day: candidateDay, activity: candidateActivity })))
      .find((candidate) => candidate.activity.id === item.activityId);

    if (fallback) return fallback;
  }

  const scheduleTitle = item.title.toLowerCase();
  const sameDayMatch = day.activities.find((activity) => {
    const activityTitle = activity.title.toLowerCase();
    return scheduleTitle.includes(activityTitle) || activityTitle.includes(scheduleTitle);
  });

  return sameDayMatch ? { day, activity: sameDayMatch } : null;
}

function getGuideContent(guide: ResourceGuide): GuideContent {
  switch (guide.title) {
    case "What is a 4-Day Design Sprint?":
      return {
        summary: "A 4-day design sprint is a structured workshop for moving from a high-risk problem to a realistic prototype tested with users. It compresses alignment, ideation, decision-making, prototyping, and validation into a focused sequence.",
        useWhen: ["You need to reduce uncertainty quickly", "A team is stuck debating options", "You need evidence before committing to delivery"],
        steps: [
          { title: "Day 1 — Understand & Define", detail: "Map the challenge, interview experts, surface assumptions, generate How Might We questions, and choose a focused target." },
          { title: "Day 2 — Ideate & Decide", detail: "Review inspiration, sketch possible solutions individually, critique silently, vote, and let the Decider choose the strongest direction." },
          { title: "Day 3 — Prototype", detail: "Create a realistic enough prototype that users can react to. Focus on the critical path, not the whole product." },
          { title: "Day 4 — Test & Validate", detail: "Run individual user tests, observe behaviour, capture evidence, identify patterns, and decide what should happen next." },
        ],
        facilitatorPrompts: [
          "The aim is not to build the final answer. The aim is to learn quickly.",
          "We will work alone together: individual thinking first, then structured group decisions.",
          "The Decider helps us keep momentum when there are several valid options.",
        ],
        checklist: ["Clear challenge", "Decider confirmed", "5-7 sprint participants", "Time protected", "Prototype method chosen", "Test users available"],
        watchouts: ["A sprint is not a general brainstorming workshop.", "Do not start without a testable challenge.", "Avoid trying to solve several unrelated problems at once."],
        outputs: ["Sprint target", "Selected solution", "Prototype", "User test evidence", "Next-step recommendation"],
      };

    case "Sprint Setup & Logistics Guide":
      return {
        summary: "Use this to prepare the sprint before people enter the room. Good setup prevents most sprint failures.",
        useWhen: ["1-2 weeks before the sprint", "When confirming the challenge", "When briefing stakeholders"],
        steps: [
          { title: "Define the challenge", detail: "Write a clear problem statement from the user’s perspective. Avoid phrasing it as a solution already chosen." },
          { title: "Confirm the Decider", detail: "Identify the person with authority to make final calls on the sprint target, selected concept, and next steps." },
          { title: "Invite the right team", detail: "Bring 5-7 people with knowledge of users, operations, policy, delivery, technology, constraints, and decision-making." },
          { title: "Book experts and users", detail: "Arrange expert interviews for Day 1 and recruit five representative users for Day 4 before the sprint begins." },
          { title: "Prepare the room and tools", detail: "Set up wall space, sticky notes, markers, timer, prototype tools, recording setup, and artefact capture." },
        ],
        facilitatorPrompts: ["What decision should this sprint help us make?", "Who must be in the room for this to be credible?", "What would make this sprint worth the time?"],
        checklist: ["Challenge agreed", "Decider confirmed", "Team invited", "Experts booked", "Users recruited", "Room/materials ready", "Prototype tools ready", "Calendar protected"],
        watchouts: ["Do not run a sprint without a real Decider.", "Avoid challenges that are too broad to prototype.", "Do not leave user recruitment until Day 4."],
        outputs: ["Sprint brief", "Team list", "Schedule", "Materials checklist", "Recruitment plan"],
      };

    case "Roles & Responsibilities":
      return {
        summary: "A clear role model keeps the sprint moving. Everyone contributes, but not everyone decides. The facilitator protects the process and the Decider protects momentum.",
        useWhen: ["Before Day 1", "When inviting participants", "When decision authority is unclear"],
        steps: [
          { title: "Facilitator", detail: "Runs the process, explains activities, manages time, encourages participation, captures outputs, and keeps the room focused." },
          { title: "Decider", detail: "Makes final calls when the team cannot agree. The Decider should be present for target selection, concept selection, and next steps." },
          { title: "Sprint team", detail: "Contributes expertise, works silently when asked, sketches ideas, votes honestly, and helps build or evaluate the prototype." },
          { title: "Experts", detail: "Join for short interviews to share knowledge about users, constraints, systems, operations, policy, or prior attempts." },
          { title: "Tester / note-taker", detail: "During user testing, one person interviews while another captures observations, quotes, behaviours, and evidence." },
        ],
        facilitatorPrompts: ["For this activity, who contributes and who decides?", "Are we asking for input or making a decision?", "Who owns the next step after this?"],
        checklist: ["Facilitator named", "Decider named", "Core team confirmed", "Experts scheduled", "Testing roles assigned", "Note-taker agreed"],
        watchouts: ["Consensus is not always the goal.", "Do not let stakeholders override user evidence without naming the trade-off.", "Avoid unclear ownership after decisions."],
        outputs: ["Role list", "Decision rights", "Testing roles", "Action owners"],
      };

    case "Sprint Facilitation Playbook":
      return {
        summary: "The live operating guide for running the sprint room. Use this as the facilitator’s anchor across all four days.",
        useWhen: ["Before every day starts", "When moving between activities", "When the room loses focus"],
        steps: [
          { title: "Set the contract", detail: "Start by explaining the goal, rules, role of the Decider, how timeboxes work, and how decisions will be made." },
          { title: "Keep the rhythm", detail: "Use short instructions, visible timeboxes, silent work, review moments, and clear transitions between activities." },
          { title: "Protect the process", detail: "Pause debates that are not helping, move off-topic items to the parking lot, and keep outputs visible." },
          { title: "Make work visible", detail: "Capture notes, votes, photos, sketches, decisions, and open questions as they happen rather than reconstructing later." },
          { title: "Close each loop", detail: "At the end of every activity, name the output, confirm what is carried forward, and record the evidence or decision." },
        ],
        facilitatorPrompts: [
          "Here is what we are doing, why it matters, and what we need by the end.",
          "Let’s work silently first so we get independent thinking.",
          "I’m going to park that because it matters, but it is not needed for this decision.",
          "Before we move on, what exactly are we carrying forward?",
        ],
        checklist: ["Challenge visible", "Timer visible", "Decider confirmed", "Parking lot visible", "Activity output named", "Artefacts captured", "Next step clear"],
        watchouts: ["Dominant voices can distort decisions.", "A weak challenge creates a weak sprint.", "Skipping capture makes the report impossible later.", "Long debates are usually a sign the decision frame is unclear."],
        outputs: ["Daily decisions", "Captured artefacts", "Running notes", "Sprint report evidence"],
      };

      case "Day Opening & Closing Scripts":
        return {
          summary: "Short scripts that reduce facilitator load and help each day feel structured, confident, and purposeful.",
          useWhen: ["At the start of each day", "After breaks", "At the end of each day"],
          steps: [
            {
              title: "Day 1 opening",
              detail:
                "Today we define the challenge and create solution directions. We will map the problem, gather expert insight, frame our long-term goal and sprint questions, choose a target, then use lightning demos and four-step sketching to create solution concepts.",
            },
            {
              title: "Day 2 opening",
              detail:
                "Today we decide and storyboard. We will review yesterday’s solution concepts in the Art Gallery, present the strongest areas, run Straw Poll and Decider voting, define the user test flow, and turn the chosen direction into a storyboard ready for prototyping.",
            },
            {
              title: "Day 3 opening",
              detail:
                "Today we prototype. We will plan the prototype, build only what is needed to test the storyboard, and review it against tomorrow’s user testing goals.",
            },
            {
              title: "Day 4 opening",
              detail:
                "Today we test and validate. We will prepare the sessions, run five user tests, observe behaviour, capture evidence, and identify the clearest patterns and next steps.",
            },
            {
              title: "Daily close",
              detail:
                "Summarise the decisions made, explain how the team arrived at the current direction, capture missing artefacts, confirm next steps, and preview what happens tomorrow.",
            },
          ],
          facilitatorPrompts: [
            "Today’s job is not to solve everything. It is to produce the next useful sprint output.",
            "We are going to trust the process and keep moving.",
            "Before we finish, what have we decided and what still needs evidence?",
          ],
          checklist: ["Goal restated", "Agenda visible", "Working agreement repeated", "Outputs named", "Artefacts captured", "Tomorrow previewed"],
          watchouts: ["Long openings drain energy.", "Vague closes create confusion the next morning.", "Do not end without naming decisions."],
          outputs: ["Daily recap", "Decision list", "Captured artefacts", "Next-day focus"],
        };

    case "Transitions & Instructions Library":
      return {
        summary: "Use transition scripts to move the room between activities without over-explaining or losing momentum.",
        useWhen: ["Between activities", "When participants look unsure", "When you need to tighten the room"],
        steps: [
          { title: "Name the shift", detail: "Explain what the team has just completed and what they are moving into next." },
          { title: "Give the task", detail: "Say exactly what people should do, how long they have, and what format to use." },
          { title: "Show the output", detail: "Give a concrete example of what good output looks like before the timebox begins." },
          { title: "Start cleanly", detail: "Confirm the timer, materials, and working mode before beginning. Silent work means silent work." },
        ],
        facilitatorPrompts: ["We are moving from understanding to choosing.", "You have eight minutes. One idea per note.", "Good enough is better than perfect here.", "We are not debating yet; we are generating options."],
        checklist: ["Task clear", "Time clear", "Output clear", "Materials ready", "Capture method ready"],
        watchouts: ["Avoid long lectures.", "Do not assume everyone understands the output format.", "Repeat the timebox before starting.", "Do not allow discussion during silent work."],
        outputs: ["Cleaner activity outputs", "Less confusion", "Better timekeeping"],
      };

    case "Long Term Goal and Sprint Questions":
      return {
        summary:
          "This activity helps the team define what long-term success looks like and expose the biggest uncertainties before choosing a sprint target. It creates a shared definition of success and a set of critical questions the sprint should help answer.",
        useWhen: ["Day 1", "Before target selection", "Before solution creation"],
        steps: [
          {
            title: "Explain the purpose",
            detail:
              "Tell the team that the Long Term Goal describes what success should look like in the future, while Sprint Questions capture what could stop that success from happening.",
          },
          {
            title: "Write long-term goals individually",
            detail:
              "Ask each participant to silently write one or more long-term goals. Encourage outcomes, behaviour changes, service improvements, adoption, confidence, impact, or measurable success rather than features.",
          },
          {
            title: "Share and combine goals",
            detail:
              "Place goals where everyone can see them, group similar statements, and discuss which goal best reflects the ambition of the sprint. The Decider can choose or combine the final wording.",
          },
          {
            title: "Create pessimistic sprint questions",
            detail:
              "Turn risks and doubts into questions. Use prompts like ‘Can we…?’, ‘Will users…?’, ‘Can the service…?’, or ‘Will this work if…?’ The aim is to make uncertainty visible, not to solve it yet.",
          },
          {
            title: "Cluster and prioritise the questions",
            detail:
              "Group similar questions and mark the ones that feel most important to answer during the sprint. Keep these visible during target selection, concept voting, storyboarding, prototyping, and testing.",
          },
        ],
        facilitatorPrompts: [
          "If this sprint is successful, what should be true in 12-24 months?",
          "What outcome would make this worth doing?",
          "What could stop this from working?",
          "What are we assuming that we need to test?",
          "Which questions are most important for users to help us answer?",
        ],
        checklist: [
          "Long-term goals written individually",
          "Final goal selected or combined",
          "Sprint questions written pessimistically",
          "Questions clustered into themes",
          "Most important questions prioritised",
          "Goal and questions captured as artefacts",
        ],
        watchouts: [
          "Avoid goals that describe a feature rather than an outcome.",
          "Do not make the Sprint Questions too safe or optimistic.",
          "Do not solve the questions during this activity — use them to guide the rest of the sprint.",
          "Make sure the Decider is involved in choosing the final goal and priority questions.",
        ],
        outputs: [
          "Long-term goal",
          "Prioritised sprint questions",
          "Visible risk themes",
          "Inputs for target selection",
          "Testing questions for Day 4",
        ],
      };
      
    case "Problem Mapping Facilitation Guide":
      return {
        summary: "Problem mapping helps the team build a shared picture of the user journey, pain points, constraints, and moments where the sprint could intervene.",
        useWhen: ["Day 1", "When the problem feels fuzzy", "Before generating HMW questions"],
        steps: [
          { title: "Choose the map frame", detail: "Map the user’s journey from trigger to outcome. Keep it user-facing rather than an internal process map." },
          { title: "Add steps", detail: "Ask the team to add the key moments the user goes through. Keep steps broad enough to see the whole journey." },
          { title: "Add pain points and questions", detail: "Capture where users struggle, where the service fails, and what the team does not yet know." },
          { title: "Mark high-risk moments", detail: "Identify points with high user pain, high uncertainty, business importance, or delivery risk." },
          { title: "Select a target area", detail: "Use discussion, voting, and Decider input to choose where the sprint should focus." },
        ],
        facilitatorPrompts: ["What does the user do before this?", "Where does the journey break down?", "What do we know versus assume?", "Where would a better experience make the biggest difference?"],
        checklist: ["User journey visible", "Pain points added", "Assumptions labelled", "Questions captured", "Target area selected", "Photo captured"],
        watchouts: ["Do not map internal teams instead of user experience.", "Avoid solving while mapping.", "Do not let the map become too detailed to use."],
        outputs: ["Journey map", "Pain points", "Assumptions", "Target area", "Problem map photo"],
      };

    case "Expert Interview Guide":
      return {
        summary:
          "Expert Interviews & How Might We is a combined Day 1 activity. Expert input brings context into the room quickly; HMW creation turns useful observations into opportunity questions the team can use for target selection and solution creation.",
        useWhen: ["Day 1", "When the team needs context", "When assumptions need surfacing", "Before target selection"],
        steps: [
          {
            title: "Brief the expert",
            detail:
              "Explain the sprint challenge and ask the expert to focus on facts, patterns, user evidence, constraints, previous attempts, risks, and anything the team must not miss.",
          },
          {
            title: "Ask open questions",
            detail:
              "Use questions that reveal user behaviour, pain points, operational constraints, previous solutions, workarounds, policy limits, and known risks. Keep the expert focused on evidence rather than pitching solutions.",
          },
          {
            title: "Capture observations silently",
            detail:
              "While the expert speaks, participants individually write useful facts, quotes, risks, assumptions, contradictions, and questions. One point per note keeps later clustering easier.",
          },
          {
            title: "Convert observations into HMWs",
            detail:
              "After each expert input, ask participants to turn the strongest observations into How Might We questions. Each HMW should begin with ‘How might we…’, describe an opportunity, and avoid embedding a specific solution.",
          },
          {
            title: "Cluster related HMWs",
            detail:
              "Place HMWs on the wall, group similar opportunities, and name the clusters. Look for repeated themes, high-risk areas, user pain, or opportunities that connect strongly to the sprint challenge.",
          },
          {
            title: "Mark the strongest opportunities",
            detail:
              "Use dots, discussion, or Decider judgement to identify which HMWs should inform target selection, lightning demos, sketching, and later user testing.",
          },
        ],
        facilitatorPrompts: [
          "What have users struggled with most?",
          "What has already been tried?",
          "What constraints must we respect?",
          "What would you warn this team not to miss?",
          "How might we turn that problem into an opportunity?",
          "Does this HMW describe an opportunity without assuming the solution?",
          "Which HMWs feel most important for the sprint target?",
        ],
        checklist: [
          "Experts or evidence sources ready",
          "Interview questions prepared",
          "Timer set",
          "Observations captured individually",
          "Direct quotes and constraints noted",
          "HMWs written from strongest observations",
          "HMWs clustered into themes",
          "Important opportunities marked for target selection",
        ],
        watchouts: [
          "Do not let experts present for too long.",
          "Avoid asking experts only for solutions.",
          "Do not treat one expert opinion as user evidence.",
          "Do not let HMWs become disguised solutions.",
          "Avoid HMWs that are so broad they cannot guide sketching or target selection.",
        ],
        outputs: [
          "Expert insights",
          "Key quotes",
          "Constraints and risks",
          "Assumptions and open questions",
          "HMW opportunity notes",
          "Clustered HMW themes",
          "Priority opportunities for target selection",
        ],
      };

    case "How Might We Workshop Guide":
      return {
        summary: "How Might We questions turn problems and insights into opportunity statements. They create a bridge between understanding the problem and generating solutions.",
        useWhen: ["After mapping", "During expert interviews", "Before choosing the sprint target"],
        steps: [
          { title: "Explain the format", detail: "Every note should start with ‘How might we…’ and describe an opportunity without embedding a specific solution." },
          { title: "Generate individually", detail: "Participants write one HMW per note. Quantity matters first; quality comes later." },
          { title: "Share and cluster", detail: "Place HMWs on the wall, group similar opportunities, and give clusters simple labels." },
          { title: "Vote", detail: "Use dots to identify the HMWs that feel most important, promising, or risky." },
          { title: "Choose a target", detail: "Use the votes as input, then let the Decider choose the area that will drive the rest of the sprint." },
        ],
        facilitatorPrompts: ["Can this be answered in more than one way?", "Is this framed around the user?", "Does this avoid assuming the solution?", "Is this specific enough to guide sketching?"],
        checklist: ["One idea per note", "No hidden solutions", "User-centred wording", "Clusters created", "Votes captured", "Target selected"],
        watchouts: ["HMWs that are too broad do not guide action.", "HMWs that contain solutions narrow thinking too early.", "Do not skip clustering before voting."],
        outputs: ["HMW wall", "Opportunity clusters", "Votes", "Selected target"],
      };

    case "Lightning Demos & Sketching Guide":
      return {
        summary:
          "Lightning Demos and Four-Step Sketch now happen on Day 1 after target selection. The aim is to move from a focused challenge into strong individual solution concepts without groupthink.",
        useWhen: ["Day 1", "After target selection", "Before Day 2 concept review"],
        steps: [
          {
            title: "Run lightning demos",
            detail:
              "Ask participants to share short examples from inside or outside the sector. Focus on useful patterns, mechanisms, service moments, content approaches, or interaction ideas — not copying whole products.",
          },
          {
            title: "Capture useful ingredients",
            detail:
              "For each example, capture the specific ingredient that could inspire the sprint challenge. Keep these visible for sketching.",
          },
          {
            title: "Move into four-step sketching",
            detail:
              "Guide participants through notes, ideas, Crazy 8s, and a final solution sketch. Work silently so every person creates an independent concept.",
          },
          {
            title: "Use the break deliberately",
            detail:
              "The sketching block includes a break. Use it to reset energy before participants finalise their strongest idea.",
          },
          {
            title: "Make final sketches self-explanatory",
            detail:
              "Each final sketch should include a title, steps, annotations, and enough context to be reviewed in the Day 2 Art Gallery without the author pitching it.",
          },
        ],
        facilitatorPrompts: [
          "What is the useful pattern in this example?",
          "How could this inspire our sprint target?",
          "What would the user do first?",
          "Can someone understand this sketch without you explaining it?",
          "What is the riskiest or most important part of the idea?",
        ],
        checklist: [
          "Lightning demo examples shared",
          "Useful ingredients captured",
          "Sketching instructions clear",
          "Silent sketching protected",
          "Crazy 8s completed",
          "Final solution sketches finished",
          "Sketches ready for Day 2 Art Gallery",
        ],
        watchouts: [
          "Do not let Lightning Demos turn into long presentations.",
          "Do not allow debate during silent sketching.",
          "Avoid judging drawing ability.",
          "Make sure sketches are understandable without the author explaining them.",
        ],
        outputs: ["Lightning demo ingredients", "Crazy 8s", "Final solution sketches", "Concepts ready for Day 2 review"],
      };

    case "Voting & Decision Framework":
      return {
        summary: "Voting helps the team reveal signal quickly, but the Decider keeps momentum by making the final call. Use voting as input, not as a substitute for decision-making.",
        useWhen: ["Target selection", "Sketch selection", "Prioritising opportunities", "Choosing next steps"],
        steps: [
          {
            title: "Set decision criteria",
            detail:
              "Explain what participants are evaluating: user value, Sprint Question coverage, feasibility, learning potential, strategic fit, or level of risk reduction.",
          },
          {
            title: "Silent review",
            detail:
              "Give participants time to inspect concepts, user flows, or storyboard sections silently before discussion begins.",
          },
          {
            title: "Run presentations",
            detail:
              "Present concepts or user test flows quickly and consistently so participants understand the key idea without long pitches or debate.",
          },
          {
            title: "Straw poll voting",
            detail:
              "Give each participant one large voting dot and ask them to vote for the strongest direction based on answering the Sprint Questions.",
          },
          {
            title: "Decider vote",
            detail:
              "Give the Decider two marked votes to select the main direction plus one wildcard option if needed.",
          },
          {
            title: "Capture the rationale",
            detail:
              "Record why the chosen direction won and what assumptions or risks still need testing.",
          },
        ],
        facilitatorPrompts: [
          "Vote for the direction you most want to test with users.",
          "Which concept best answers our Sprint Questions?",
          "What risk would this help us learn about?",
          "Decider, what are we carrying forward into storyboarding?",
        ],
        checklist: ["Criteria named", "Silent review done", "Votes captured", "Rationale captured", "Final choice made", "Artefact photographed"],
        watchouts: ["Dot voting can reward popularity or polish.", "Do not force consensus.", "Do not ignore a Decider concern simply because votes clustered elsewhere."],
        outputs: [
          "Voting board",
          "Winning concept",
          "Wildcard concept",
          "Decision rationale",
          "Storyboard direction",
        ],
      };

      case "User Test Flow & Storyboarding Guide":
        return {
          summary:
            "This guide supports the Day 2 flow from selected concept to user test flow and storyboard. The goal is to define the exact experience users will move through, then turn it into a clear storyboard for Day 3 prototyping.",
          useWhen: ["Day 2", "After concept selection", "Before prototyping"],
          steps: [
            {
              title: "Create individual user test flows",
              detail:
                "Use the 123/ABC wall matrix. Ask each participant to use six post-its to outline a rough user journey that could test the selected concept and sprint questions.",
            },
            {
              title: "Present and compare flows",
              detail:
                "Have participants present their flow quickly. Keep the focus on the user journey, not detailed screens or interface polish.",
            },
            {
              title: "Vote and decide",
              detail:
                "Give each person one vote for the preferred flow. Then give the Decider two votes to select the main test flow and a wildcard if useful.",
            },
            {
              title: "Storyboard Part 1",
              detail:
                "Create 10 panels and align the chosen user test flow into the storyboard. Walk through the rough story, then move in concept sketches to fill the major gaps.",
            },
            {
              title: "Storyboard Part 2",
              detail:
                "Fill in details, missing states, transitions, confirmations, and in-between moments. Walk through the finished storyboard from the user’s point of view.",
            },
            {
              title: "Prioritise prototype screens",
              detail:
                "Mark the screens or moments that must be built if time becomes tight. This helps the Day 3 prototype team protect the most important parts of the test.",
            },
          ],
          facilitatorPrompts: [
            "What journey do users need to experience for us to learn?",
            "Which flow best answers the Sprint Questions?",
            "What are the minimum screens or moments needed for a valid test?",
            "Where might users need feedback, confirmation, or transition states?",
            "If we run out of time tomorrow, which screens absolutely must exist?",
          ],
          checklist: [
            "123/ABC matrix created",
            "Individual user test flows completed",
            "Flows presented and voted on",
            "Decider selected main flow and wildcard",
            "10 storyboard panels created",
            "Concept sketches placed into the storyboard",
            "Missing states and transitions added",
            "Priority prototype screens marked",
          ],
          watchouts: [
            "Do not start storyboarding before the user test flow is clear.",
            "Avoid adding every possible feature to the storyboard.",
            "Do not skip in-between states that users need to understand the journey.",
            "Keep the storyboard focused on what needs to be tested, not what would be built in the final product.",
          ],
          outputs: [
            "Selected user test flow",
            "Wildcard flow or idea",
            "10-panel storyboard",
            "Priority prototype screens",
            "Prototype handover for Day 3",
          ],
        };

    case "Prototyping Guide":
      return {
        summary: "A sprint prototype should be realistic enough to generate valid user reactions, but lightweight enough to build in a day. Build the illusion of the experience, not the full system.",
        useWhen: ["Day 3", "After selecting a concept", "Before user testing"],
        steps: [
          {
            title: "Define the user test flow",
            detail:
              "Identify the exact journey users will experience during testing. Focus on the smallest realistic path needed to answer the Sprint Questions.",
          },
          {
            title: "Create the storyboard structure",
            detail:
              "Build a 10-panel storyboard and align the chosen user test flow into the panels before discussing detailed screens.",
          },
          {
            title: "Strengthen the journey",
            detail:
              "Move in sketches, concepts, and interface ideas from earlier activities to fill gaps and improve weak moments in the flow.",
          },
          {
            title: "Fill in missing states",
            detail:
              "Make sure important transitions, loading states, confirmations, and in-between moments are represented so the experience feels coherent.",
          },
          {
            title: "Identify critical prototype screens",
            detail:
              "Mark the highest-priority screens that absolutely must exist if the prototype scope needs reducing later.",
          },
          {
            title: "Prepare for prototyping",
            detail:
              "Assign roles, choose prototype fidelity, and confirm the target testing audience before Day 3 begins.",
          },
        ],
        facilitatorPrompts: ["What do users need to believe is real?", "What can we fake safely?", "What is the critical path?", "What question will this prototype help answer?"],
        checklist: [
          "User test flow agreed",
          "Storyboard panels created",
          "Concept sketches integrated",
          "Missing states filled",
          "Critical screens identified",
          "Prototype approach agreed",
        ],
        watchouts: ["Do not build the entire product.", "Do not spend the day perfecting visual details.", "Avoid features that are not needed for the test question."],
        outputs: [
          "User test flow",
          "Storyboard",
          "Priority prototype screens",
          "Prototype plan",
          "Testing audience definition",
        ],
      };

    case "User Testing Guide":
      return {
        summary: "User testing in a sprint is designed to reveal behaviour, comprehension, value, and risk. The goal is learning, not proving that the prototype is right.",
        useWhen: ["Day 4", "When prototype is ready", "When evidence is needed for next steps"],
        steps: [
          { title: "Prepare the session", detail: "Set up the prototype, script, note-taking, recording if appropriate, consent, and scenario." },
          { title: "Start neutrally", detail: "Make it clear you are testing the prototype, not the participant. Encourage honest reactions." },
          { title: "Give realistic tasks", detail: "Ask users to complete tasks or respond to scenarios rather than asking whether they like the idea." },
          { title: "Observe behaviour", detail: "Capture what users do, where they hesitate, what they misunderstand, and what they value." },
          { title: "Debrief immediately", detail: "After each session, capture key observations, quotes, signals, and questions before the next user." },
        ],
        facilitatorPrompts: ["What would you do first?", "What are you expecting to happen?", "What are you thinking as you look at this?", "What would make this more useful?"],
        checklist: ["Users scheduled", "Script ready", "Prototype ready", "Consent handled", "Note-taker assigned", "Debriefs completed", "Patterns reviewed"],
        watchouts: ["Do not lead the user.", "Do not explain the prototype too much.", "Do not treat polite praise as validation.", "Watch behaviour more than opinion."],
        outputs: ["Testing notes", "User quotes", "Behavioural observations", "Validated and invalidated assumptions", "Next-step recommendations"],
      };

    case "Room Dynamics & Participation":
      return {
        summary: "Good facilitation makes participation balanced, safe, and useful. The process should prevent hierarchy, confidence, or personality from dominating the sprint output.",
        useWhen: ["All days", "When voices are uneven", "When groupthink appears"],
        steps: [
          { title: "Set working agreements", detail: "Explain silent work, one conversation at a time, timeboxing, user focus, and parking lot rules." },
          { title: "Use silent generation", detail: "Ask people to write or sketch before discussion so quieter participants contribute equally." },
          { title: "Invite quieter voices", detail: "Use structured rounds, written input, or direct but low-pressure invitations to contribute." },
          { title: "Contain dominant voices", detail: "Acknowledge useful input, then redirect to the activity, timebox, or Decider." },
        ],
        facilitatorPrompts: ["Let’s get ideas down silently first.", "I want to hear from someone who has not spoken yet.", "Let’s hold that and return after the vote.", "What would the user say here?"],
        checklist: ["Working agreements visible", "Silent work used", "Equal contribution encouraged", "Dominance managed", "Parking lot used"],
        watchouts: ["Expertise can accidentally silence users or frontline perspectives.", "The loudest view is not always the strongest evidence.", "Do not let humour undermine psychological safety."],
        outputs: ["Balanced inputs", "Parking lot notes", "Clearer decisions", "Safer participation"],
      };

    case "Energy, Pacing & Timeboxing":
      return {
        summary: "Timeboxing creates momentum and prevents the sprint becoming a normal meeting. The facilitator’s job is to make time visible and protect energy.",
        useWhen: ["All days", "When activities are overrunning", "When energy drops"],
        steps: [
          { title: "State the timebox", detail: "Tell the team exactly how long they have and what output is needed before the timer starts." },
          { title: "Make time visible", detail: "Use a visible timer and give warnings at sensible points: halfway, five minutes, one minute." },
          { title: "Prefer smaller loops", detail: "Break long activities into shorter rounds with quick captures and reviews." },
          { title: "Recover deliberately", detail: "If time slips, reduce scope, defer discussion, or ask the Decider for a trade-off." },
        ],
        facilitatorPrompts: ["You have five minutes left; focus on the output.", "We are going to move on and capture this as a risk.", "Good enough is enough for this stage.", "Which part of this matters most to finish?"],
        checklist: ["Timer visible", "Warnings given", "Breaks protected", "Scope reduced when needed", "Decider used for trade-offs"],
        watchouts: ["Overruns compound quickly.", "Skipping breaks usually reduces quality later.", "Do not let perfectionism consume prototype time."],
        outputs: ["Completed activities", "Captured trade-offs", "More predictable sprint flow"],
      };

    case "Handling Conflict & Disagreement":
      return {
        summary: "Disagreement is useful when it reveals assumptions, risks, or competing priorities. The facilitator should structure disagreement rather than suppress it.",
        useWhen: ["When debate gets circular", "When stakeholders disagree", "When the Decider hesitates"],
        steps: [
          { title: "Name the disagreement", detail: "State the decision or assumption that people are disagreeing about in neutral language." },
          { title: "Separate evidence from opinion", detail: "Ask what is known, what is assumed, and what could be tested." },
          { title: "Use a decision mechanism", detail: "Apply voting, Decider call, risk capture, or a test question to move forward." },
          { title: "Capture the trade-off", detail: "Record what was chosen, what was deferred, and what concern remains." },
        ],
        facilitatorPrompts: ["What are we actually deciding?", "What evidence supports that?", "Can this become something we test?", "Decider, what direction should we take for now?"],
        checklist: ["Issue named", "Evidence separated", "Decision route chosen", "Trade-off captured", "Sprint continues"],
        watchouts: ["Do not aim for consensus at every point.", "Do not let disagreement become personal.", "Do not bury risks to keep the room comfortable."],
        outputs: ["Decision", "Risk note", "Testable assumption", "Parking lot item"],
      };

    case "Artefact Capture Guide":
      return {
        summary: "How to capture physical sprint-wall work so the app becomes the source of truth for the sprint report.",
        useWhen: ["After every activity", "Before removing notes from a wall", "When key decisions are made"],
        steps: [
          { title: "Capture immediately", detail: "Take photos while the room context is still fresh. Do not wait until the end of the day." },
          { title: "Name the artefact", detail: "Give each artefact a title that makes sense later, such as Problem Map, HMW Cluster, Voting Board, or Storyboard." },
          { title: "Theme notes", detail: "Use note types such as Insight, Opportunity, Parking lot, Decision, Risk, and Question to make evidence scannable." },
          { title: "Add context", detail: "Add a caption explaining what the artefact shows, why it matters, and what decision or evidence it supports." },
          { title: "Check report usefulness", detail: "Ask whether a stakeholder could understand the artefact without being in the room." },
        ],
        facilitatorPrompts: ["What should this artefact be called in the report?", "Is this an insight, opportunity, decision, risk, or question?", "What context would someone need later?"],
        checklist: ["Photo uploaded", "Title added", "Caption added", "Note type selected", "Linked to correct activity", "Decision or evidence clear"],
        watchouts: ["Untitled photos become useless later.", "Do not capture only the final output; capture important intermediate decisions too.", "Avoid mixing decisions and questions in one note."],
        outputs: ["Photo evidence", "Themed notes", "Report-ready artefacts"],
      };

    case "Synthesis & Insight Capture":
      return {
        summary: "Turn messy notes and artefacts into clear patterns, evidence, and decisions the team can act on.",
        useWhen: ["After interviews", "After testing", "At the end of Day 4", "Before writing the report"],
        steps: [
          { title: "Group similar items", detail: "Cluster notes by theme, behaviour, pain point, user need, risk, or opportunity." },
          { title: "Separate evidence from interpretation", detail: "Mark what users did or said separately from what the team thinks it means." },
          { title: "Name the pattern", detail: "Write a short insight statement that explains the meaning of the cluster." },
          { title: "Assess confidence", detail: "Distinguish strong repeated evidence from weaker signals or assumptions." },
          { title: "Connect to action", detail: "Turn each important pattern into a decision, risk, design change, or next step." },
        ],
        facilitatorPrompts: ["What pattern keeps repeating?", "What did users actually do?", "How confident are we?", "What decision does this evidence support?"],
        checklist: ["Themes grouped", "Evidence labelled", "Insights named", "Confidence assessed", "Risks captured", "Next steps agreed"],
        watchouts: ["Do not over-weight one loud quote.", "Avoid turning every observation into a feature request.", "Keep weak evidence labelled as weak."],
        outputs: ["Insight themes", "Evidence summary", "Decisions", "Next-step recommendations"],
      };

    case "Sprint Report & Next Steps":
      return {
        summary: "The sprint report should explain what was tested, what was learned, what evidence supports the conclusion, and what should happen next.",
        useWhen: ["After Day 4", "When briefing stakeholders", "Before moving into delivery or another discovery cycle"],
        steps: [
          { title: "Summarise the challenge", detail: "Restate the user problem, target users, desired outcome, and sprint focus." },
          { title: "Show the journey", detail: "Include key artefacts: map, HMWs, sketches, voting outputs, storyboard, prototype, and testing evidence." },
          { title: "Explain what was tested", detail: "Describe the prototype, testing approach, users involved, and tasks or scenarios." },
          { title: "Present findings", detail: "Group findings into validated signals, warning signs, unanswered questions, and opportunities." },
          { title: "Recommend next steps", detail: "State whether to proceed, iterate, stop, research further, or run another sprint." },
        ],
        facilitatorPrompts: ["What decision does this report need to support?", "What evidence is strongest?", "What should stakeholders do next?", "What remains uncertain?"],
        checklist: ["Challenge included", "Target users included", "Prototype described", "Artefacts included", "Testing evidence summarised", "Recommendation clear"],
        watchouts: ["Do not make the report a diary of everything that happened.", "Do not hide uncertainty.", "Avoid recommendations that are not supported by evidence."],
        outputs: ["Sprint report", "Decision recommendation", "Evidence pack", "Next-step plan"],
      };

    case "What If Things Go Wrong?":
      return {
        summary: "A practical troubleshooting guide for common sprint failure modes and how to recover without derailing the room.",
        useWhen: ["The room is stuck", "The team disagrees", "Time is slipping", "The evidence is unclear"],
        steps: [
          { title: "Pause and name it", detail: "Briefly state what is happening without blame: time, uncertainty, disagreement, lack of evidence, or unclear decision." },
          { title: "Choose a recovery move", detail: "Use a timebox, Decider call, parking lot, silent vote, narrowed question, or reduced scope to restore momentum." },
          { title: "Capture the trade-off", detail: "Record what was decided, what was deferred, what risk remains, and who owns the next action." },
          { title: "Restart the room", detail: "Restate the current objective and move immediately into the next small action." },
        ],
        facilitatorPrompts: ["I’m noticing we are circling. What decision is actually needed?", "Let’s separate evidence from opinion.", "This is important, so I’m parking it rather than losing it.", "What is the smallest useful next step?"],
        checklist: ["Issue named", "Recovery move chosen", "Decider involved if needed", "Risk captured", "Next action clear", "Sprint continues"],
        watchouts: ["Do not let unresolved tension sit unspoken.", "Do not debate every point to consensus.", "Do not sacrifice testing time unless absolutely necessary."],
        outputs: ["Recovery decision", "Parking lot item", "Risk note", "Next action"],
      };

    case "Remote & Hybrid Sprint Adjustments":
      return {
        summary: "Remote and hybrid sprints need more explicit facilitation, clearer artefact capture, shorter instructions, and stronger participation design.",
        useWhen: ["Remote sprint", "Hybrid workshop", "Distributed team", "Digital whiteboard environment"],
        steps: [
          { title: "Reduce ambiguity", detail: "Share links, agenda, working norms, and tool instructions before the session." },
          { title: "Design participation", detail: "Use silent digital work, chat input, structured rounds, and explicit turn-taking to avoid remote voices being lost." },
          { title: "Shorten activity loops", detail: "Remote fatigue is real. Use shorter bursts, more visible timers, and more frequent check-ins." },
          { title: "Capture digitally", detail: "Use screenshots, exported boards, named artefacts, and notes attached to the correct activity." },
          { title: "Protect decisions", detail: "Make voting and Decider calls very explicit so hybrid ambiguity does not slow progress." },
        ],
        facilitatorPrompts: ["Please add your notes silently to the board.", "Remote participants first on this round.", "I’m going to summarise what I’m seeing before we vote.", "Decider, please confirm the direction."],
        checklist: ["Links shared", "Tools tested", "Timer visible", "Remote participation plan", "Board/export capture", "Backup communication channel"],
        watchouts: ["Hybrid rooms often privilege people physically present.", "Tool friction can consume sprint time.", "Do not assume silence means agreement."],
        outputs: ["Digital board", "Screenshots", "Remote participation notes", "Decision record"],
      };

    default:
      return {
        summary: guide.description,
        useWhen: [guide.stage, guide.audience, guide.time],
        steps: [
          { title: "Frame the purpose", detail: "Explain why this matters, what the team will do, and what output should exist by the end." },
          { title: "Run the method", detail: "Use a clear timebox, keep instructions visible, and capture the output as the activity happens." },
          { title: "Make the output useful", detail: "Name the decision, evidence, or artefact created so it can be reused in the report." },
        ],
        facilitatorPrompts: ["What are we trying to learn or decide here?", "What evidence do we have, and what is still an assumption?", "What should we capture before we move on?"],
        checklist: ["Clear objective", "Visible timebox", "Named owner", "Captured artefacts", "Next step agreed"],
        watchouts: ["Do not let discussion replace capture.", "Avoid solving before the problem is understood.", "Keep the Decider involved at decision points."],
        outputs: ["Notes", "Artefacts", "Decision or next step"],
      };
  }
}

type TestingSession = {
  participant: string;
  role?: string;
  clarityScore: number;
  usefulnessScore: number;
  confidenceScore: number;
  taskCompletionScore: number;
  keyQuote: string;
  observedBehaviour: string;
  frictionPoint: string;
  positiveSignal: string;
  recommendation: string;
};

type AppState = {
  currentDay: DayId;
  sprintName: string;
  challenge: string;
  targetUsers: string;
  desiredOutcome: string;
  completed: string[];
  notes: Record<string, string>;
  artefacts: Record<string, Artefact[]>;
  hmws: string[];
  testingSessions: Record<string, TestingSession>;
  scheduleOverrides: Partial<Record<DayId, SprintDay["schedule"]>>;
  runningActivityId?: string;
  runningActivityStartedAt?: number;
  runningActivityDurationSeconds?: number;
  runningActivityPausedAt?: number;
  runningActivityPausedTotalMs?: number;
};

type Action =
  | { type: "session/replace"; state: AppState }
  | { type: "nav/setDay"; dayId: DayId }
  | { type: "setup/update"; field: "sprintName" | "challenge" | "targetUsers" | "desiredOutcome"; value: string }
  | { type: "activity/run"; key: string }
  | { type: "activity/pause" }
  | { type: "activity/resume" }
  | { type: "activity/stop" }
  | { type: "activity/complete"; key: string }
  | { type: "activity/addTime"; seconds: number }
  | { type: "activity/toggleComplete"; key: string }
  | { type: "notes/set"; key: string; value: string }
  | { type: "artefact/add"; key: string; artefact: Artefact }
  | { type: "artefact/remove"; key: string; artefactId: string }
  | { type: "artefact/updateName"; key: string; artefactId: string; name: string }
  | { type: "artefact/updateCaption"; key: string; artefactId: string; caption: string }
  | { type: "artefact/updateNoteKind"; key: string; artefactId: string; noteKind: Artefact["noteKind"] }
  | { type: "hmw/addMany"; questions: string[]; writeToDay1HmwNotes?: boolean }
  | { type: "hmw/delete"; question: string }
  | { type: "testing/updateSession"; key: string; field: keyof TestingSession; value: string | number }
  | { type: "schedule/updateItem"; dayId: DayId; index: number; field: "time" | "title" | "duration"; value: string }
  | { type: "schedule/toggleBreak"; dayId: DayId; index: number }
  | { type: "schedule/addItem"; dayId: DayId }
  | { type: "schedule/removeItem"; dayId: DayId; index: number }
  | { type: "schedule/moveItem"; dayId: DayId; index: number; direction: "up" | "down" }
  | { type: "schedule/moveItemToDay"; fromDayId: DayId; index: number; toDayId: DayId }
  | { type: "schedule/resetDay"; dayId: DayId };

const initialState: AppState = {
  currentDay: "day1",
  sprintName: "Design Sprint Facilitator",
  challenge: "Users struggle to find the right place to report things on our website and end up sending the wrong forms or the right forms to the wrong place.",
  targetUsers: "Aberdeen City Council residents",
  desiredOutcome: "A testable prototype",
  completed: [],
  notes: {},
  artefacts: {},
  hmws: [],
  testingSessions: {},
  scheduleOverrides: {},
  runningActivityId: undefined,
  runningActivityStartedAt: undefined,
  runningActivityDurationSeconds: undefined,
  runningActivityPausedAt: undefined,
  runningActivityPausedTotalMs: 0,
};

type SprintSessionStatus = "draft" | "live" | "complete" | "archived";

type SprintSession = {
  id: string;
  cloudId?: string;
  name: string;
  status: SprintSessionStatus;
  createdAt: number;
  updatedAt: number;
  state: AppState;
};

const SPRINTPILOT_LEGACY_STORAGE_KEY = "sprintpilot.currentSession.v1";
const SPRINTPILOT_SESSIONS_KEY = "sprintpilot.sessions.v1";
const SPRINTPILOT_ACTIVE_SESSION_KEY = "sprintpilot.activeSessionId.v1";

type CloudSprintSessionRow = {
  id: string;
  name: string;
  status: SprintSessionStatus;
  session_data?: AppState | null;
  state?: AppState | null;
  created_at: string;
  updated_at: string;
};

function cloudRowToSprintSession(row: CloudSprintSessionRow): SprintSession {
  const sourceState = row.session_data ?? row.state ?? initialState;

  return {
    id: row.id,
    cloudId: row.id,
    name: row.name || sourceState.sprintName || "Untitled sprint",
    status: row.status ?? "draft",
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    state: normaliseAppState(sourceState),
  };
}

async function fetchCloudSessions(): Promise<SprintSession[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("sprint_sessions")
    .select("id,name,status,state,session_data,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch cloud sprint sessions", error);
    return [];
  }

  return ((data ?? []) as CloudSprintSessionRow[]).map(cloudRowToSprintSession);
}

async function fetchCloudSessionById(sessionId: string): Promise<SprintSession | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("sprint_sessions")
    .select("id,name,status,state,session_data,created_at,updated_at")
    .eq("id", sessionId)
    .single();

  if (error || !data) {
    console.error("Failed to fetch shared report sprint session", error);
    return null;
  }

  return cloudRowToSprintSession(data as CloudSprintSessionRow);
}

async function createCloudSession(state: AppState, status: SprintSessionStatus = "draft"): Promise<SprintSession | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("sprint_sessions")
    .insert({
      id: createSessionId(),
      name: state.sprintName || "Untitled sprint",
      status,
      session_data: state,
      updated_at: new Date().toISOString(),
    })
    .select("id,name,status,session_data,created_at,updated_at")
    .single();

  if (error) {
    console.error("Failed to create cloud sprint session", error);
    return null;
  }

  return cloudRowToSprintSession(data as CloudSprintSessionRow);
}

async function updateCloudSession(sessionId: string, state: AppState, status?: SprintSessionStatus): Promise<void> {
  if (!supabase) return;

  const payload: { name: string; session_data: AppState; updated_at: string; status?: SprintSessionStatus } = {
    name: state.sprintName || "Untitled sprint",
    session_data: state,
    updated_at: new Date().toISOString(),
  };

  if (status) payload.status = status;

  const { error } = await supabase.from("sprint_sessions").update(payload).eq("id", sessionId);

  if (error) console.error("Failed to update cloud sprint session", error);
}

async function syncLocalSessionsToCloud(localSessions: SprintSession[]): Promise<SprintSession[]> {
  if (!supabase) return localSessions;

  const syncedSessions = await Promise.all(
    localSessions.map(async (session) => {
      const cloudId = session.cloudId ?? session.id;
      const now = new Date(session.updatedAt || Date.now()).toISOString();

      const { data, error } = await supabase!
        .from("sprint_sessions")
        .upsert({
          id: cloudId,
          name: session.name || session.state.sprintName || "Untitled sprint",
          status: session.status ?? "live",
          session_data: session.state,
          updated_at: now,
        })
        .select("id,name,status,session_data,created_at,updated_at")
        .single();

      if (error || !data) {
        console.error("Failed to sync local sprint session to cloud", error);
        return session;
      }

      return cloudRowToSprintSession(data as CloudSprintSessionRow);
    }),
  );

  writeStoredSessions(syncedSessions);
  return syncedSessions;
}

function createSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normaliseAppState(parsed: Partial<AppState>): AppState {
  return {
    ...initialState,
    ...parsed,
    completed: Array.isArray(parsed.completed) ? parsed.completed : initialState.completed,
    notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : initialState.notes,
    artefacts: parsed.artefacts && typeof parsed.artefacts === "object" ? parsed.artefacts : initialState.artefacts,
    hmws: Array.isArray(parsed.hmws) ? parsed.hmws : initialState.hmws,

    testingSessions:
      parsed.testingSessions && typeof parsed.testingSessions === "object"
        ? parsed.testingSessions
        : initialState.testingSessions,
    scheduleOverrides:
      parsed.scheduleOverrides && typeof parsed.scheduleOverrides === "object"
        ? parsed.scheduleOverrides
        : initialState.scheduleOverrides,
    currentDay: DAY_IDS.includes(parsed.currentDay as DayId) ? (parsed.currentDay as DayId) : initialState.currentDay,
    runningActivityStartedAt: typeof parsed.runningActivityStartedAt === "number" ? parsed.runningActivityStartedAt : initialState.runningActivityStartedAt,
    runningActivityDurationSeconds: typeof parsed.runningActivityDurationSeconds === "number" ? parsed.runningActivityDurationSeconds : initialState.runningActivityDurationSeconds,
    runningActivityPausedAt: typeof parsed.runningActivityPausedAt === "number" ? parsed.runningActivityPausedAt : initialState.runningActivityPausedAt,
    runningActivityPausedTotalMs: typeof parsed.runningActivityPausedTotalMs === "number" ? parsed.runningActivityPausedTotalMs : initialState.runningActivityPausedTotalMs,
  };
}

function createSprintSession(state: AppState, overrides: Partial<SprintSession> = {}): SprintSession {
  const now = Date.now();

  return {
    id: overrides.id ?? createSessionId(),
    cloudId: overrides.cloudId,
    name: state.sprintName || "Untitled sprint",
    status: overrides.status ?? "live",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    state,
  };
}

function readStoredSessions(): SprintSession[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(SPRINTPILOT_SESSIONS_KEY);

    if (saved) {
      const parsed = JSON.parse(saved) as SprintSession[];

      if (Array.isArray(parsed)) {
        return parsed
          .filter((session) => session && typeof session.id === "string" && session.state)
          .map((session) => ({
            ...session,
            cloudId: session.cloudId,
            name: session.name || session.state.sprintName || "Untitled sprint",
            status: session.status ?? "live",
            state: normaliseAppState(session.state),
          }));
      }
    }

    const legacy = window.localStorage.getItem(SPRINTPILOT_LEGACY_STORAGE_KEY);
    if (!legacy) return [];

    const legacyState = normaliseAppState(JSON.parse(legacy) as Partial<AppState>);
    return [createSprintSession(legacyState)];
  } catch {
    return [];
  }
}

function writeStoredSessions(sessions: SprintSession[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SPRINTPILOT_SESSIONS_KEY, JSON.stringify(sessions));
}

function loadActiveSession(): SprintSession {
  if (typeof window === "undefined") return createSprintSession(initialState);

  const sessions = readStoredSessions();
  const activeSessionId = window.localStorage.getItem(SPRINTPILOT_ACTIVE_SESSION_KEY);
  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ??
    sessions.find((session) => session.status !== "archived") ??
    sessions[0];

  if (activeSession) {
    window.localStorage.setItem(SPRINTPILOT_ACTIVE_SESSION_KEY, activeSession.id);
    writeStoredSessions(sessions);
    return activeSession;
  }

  const newSession = createSprintSession(initialState, { status: "draft" });

  window.localStorage.setItem(SPRINTPILOT_ACTIVE_SESSION_KEY, newSession.id);
  writeStoredSessions([newSession]);

  return newSession;
}

function saveSessionState(sessionId: string, state: AppState) {
  if (typeof window === "undefined") return;

  const sessions = readStoredSessions();
  const existingSession = sessions.find((session) => session.id === sessionId);

  const updatedSession = createSprintSession(state, {
    id: sessionId,
    cloudId: existingSession?.cloudId,
    status: existingSession?.status ?? "live",
    createdAt: existingSession?.createdAt,
    updatedAt: Date.now(),
  });

  const nextSessions = existingSession
    ? sessions.map((session) => (session.id === sessionId ? updatedSession : session))
    : [updatedSession, ...sessions];

    writeStoredSessions(nextSessions);
    window.localStorage.setItem(SPRINTPILOT_ACTIVE_SESSION_KEY, sessionId);
    
    if (existingSession?.cloudId) {
      void updateCloudSession(existingSession.cloudId, state);
    }
}

function activityDurationToSeconds(duration: string) {
  const lower = duration.toLowerCase();
  const hours = lower.match(/(\d+(?:\.\d+)?)\s*h/);
  const minutes = lower.match(/(\d+(?:\.\d+)?)\s*m/);

  if (hours) return Math.round(Number(hours[1]) * 60 * 60);
  if (minutes) return Math.round(Number(minutes[1]) * 60);

  const firstNumber = lower.match(/\d+/);
  return firstNumber ? Number(firstNumber[0]) * 60 : 30 * 60;
}

function formatScheduleMinutes(totalMinutes: number) {
  const rounded = Math.round(totalMinutes);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getActivityTimeRange(day: SprintDay, activityIndex: number) {
  const activity = day.activities[activityIndex];
  const scheduleItem = day.schedule.find((item) => item.title === activity?.title);

  if (scheduleItem?.time && activity) {
    const match = scheduleItem.time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (match) {
      const rawHour = Number(match[1]);
      const minute = Number(match[2]);
      const period = match[3].toUpperCase();
      const hour = period === "PM" && rawHour !== 12 ? rawHour + 12 : period === "AM" && rawHour === 12 ? 0 : rawHour;
      const startMinutes = hour * 60 + minute;
      const endMinutes = startMinutes + activityDurationToSeconds(activity.duration) / 60;
      return `${formatScheduleMinutes(startMinutes)} – ${formatScheduleMinutes(endMinutes)}`;
    }
  }

  let startMinutes = 9 * 60;

  for (let index = 0; index < activityIndex; index += 1) {
    startMinutes += activityDurationToSeconds(day.activities[index].duration) / 60;
  }

  const endMinutes = startMinutes + activityDurationToSeconds(activity.duration) / 60;
  return `${formatScheduleMinutes(startMinutes)} – ${formatScheduleMinutes(endMinutes)}`;
}

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function useActivityCountdown(state: AppState) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (
      !state.runningActivityId ||
      !state.runningActivityStartedAt ||
      !state.runningActivityDurationSeconds
    ) {
      setNow(Date.now());
      return;
    }

    setNow(Date.now());

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    state.runningActivityId,
    state.runningActivityStartedAt,
    state.runningActivityDurationSeconds,
    state.runningActivityPausedAt,
    state.runningActivityPausedTotalMs,
  ]);

  const totalSeconds = state.runningActivityDurationSeconds ?? 0;
  const startedAt = state.runningActivityStartedAt ?? now;
  const pausedAt = state.runningActivityPausedAt;
  const pausedTotalMs = state.runningActivityPausedTotalMs ?? 0;
  const effectiveNow = pausedAt ?? now;
  const elapsedSeconds = Math.max(
    0,
    Math.floor((effectiveNow - startedAt - pausedTotalMs) / 1000)
  );
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const isOvertime = Boolean(
    state.runningActivityId &&
      totalSeconds > 0 &&
      elapsedSeconds >= totalSeconds
  );
  const progressPercent =
    totalSeconds > 0
      ? Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100))
      : 0;

  return {
    totalSeconds,
    elapsedSeconds,
    remainingSeconds,
    isOvertime,
    progressPercent,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "session/replace": {
      return action.state;
    }
    case "nav/setDay": {
      return { ...state, currentDay: action.dayId };
    }
    case "setup/update": {
      return { ...state, [action.field]: action.value };
    }
    case "activity/run": {
      const dayId = action.key.split("-")[0] as DayId;
      const activityId = action.key.replace(`${dayId}-`, "");
      const day = sprintDays.find((item) => item.id === dayId);
      const activity = day?.activities.find((item) => item.id === activityId);

      const schedule = state.scheduleOverrides[dayId] ?? day?.schedule ?? [];

      const scheduleItem = schedule.find((item) => {
        if (item.isBreak) return false;
        if ((item as any).activityId === activityId) return true;

        const scheduleTitle = item.title.toLowerCase();
        const activityTitle = activity?.title.toLowerCase() ?? "";
        return scheduleTitle.includes(activityTitle) || activityTitle.includes(scheduleTitle);
      });

      const durationSeconds = scheduleItem
        ? activityDurationToSeconds(scheduleItem.duration)
        : activity
        ? activityDurationToSeconds(activity.duration)
        : 30 * 60;

      return {
        ...state,
        runningActivityId: action.key,
        runningActivityStartedAt: Date.now(),
        runningActivityDurationSeconds: durationSeconds,
        runningActivityPausedAt: undefined,
        runningActivityPausedTotalMs: 0,
        currentDay: dayId,
      };
    }
    case "activity/stop": {
      return {
        ...state,
        runningActivityId: undefined,
        runningActivityStartedAt: undefined,
        runningActivityDurationSeconds: undefined,
        runningActivityPausedAt: undefined,
        runningActivityPausedTotalMs: 0,
      };
    }
    case "activity/complete": {
      const alreadyCompleted = state.completed.includes(action.key);

      return {
        ...state,
        completed: alreadyCompleted
          ? state.completed
          : [...state.completed, action.key],
        runningActivityId:
          state.runningActivityId === action.key
            ? undefined
            : state.runningActivityId,
        runningActivityStartedAt:
          state.runningActivityId === action.key
            ? undefined
            : state.runningActivityStartedAt,
        runningActivityDurationSeconds:
          state.runningActivityId === action.key
            ? undefined
            : state.runningActivityDurationSeconds,
        runningActivityPausedAt:
          state.runningActivityId === action.key
            ? undefined
            : state.runningActivityPausedAt,
        runningActivityPausedTotalMs:
          state.runningActivityId === action.key
            ? 0
            : state.runningActivityPausedTotalMs,
      };
    }
    case "activity/addTime": {
      if (!state.runningActivityId) return state;

      return {
        ...state,
        runningActivityDurationSeconds: (state.runningActivityDurationSeconds ?? 0) + action.seconds,
      };
    }
    case "activity/pause": {
      if (!state.runningActivityId || state.runningActivityPausedAt) return state;

      return {
        ...state,
        runningActivityPausedAt: Date.now(),
      };
    }
    case "activity/resume": {
      if (!state.runningActivityId || !state.runningActivityPausedAt) return state;

      const pausedForMs = Date.now() - state.runningActivityPausedAt;

      return {
        ...state,
        runningActivityPausedAt: undefined,
        runningActivityPausedTotalMs: (state.runningActivityPausedTotalMs ?? 0) + pausedForMs,
      };
    }
    case "activity/toggleComplete": {
      const isDone = state.completed.includes(action.key);

      return {
        ...state,
        completed: isDone
          ? state.completed.filter((k) => k !== action.key)
          : [...state.completed, action.key],
      };
    }
    case "notes/set": {
      return { ...state, notes: { ...state.notes, [action.key]: action.value } };
    }
    case "artefact/add": {
      return {
        ...state,
        artefacts: {
          ...state.artefacts,
          [action.key]: [...(state.artefacts[action.key] ?? []), action.artefact],
        },
      };
    }
    case "artefact/remove": {
      return {
        ...state,
        artefacts: {
          ...state.artefacts,
          [action.key]: (state.artefacts[action.key] ?? []).filter((artefact) => artefact.id !== action.artefactId),
        },
      };
    }
    case "artefact/updateName": {
      return {
        ...state,
        artefacts: {
          ...state.artefacts,
          [action.key]: (state.artefacts[action.key] ?? []).map((artefact) =>
            artefact.id === action.artefactId ? { ...artefact, name: action.name } : artefact,
          ),
        },
      };
    }
    case "artefact/updateCaption": {
      return {
        ...state,
        artefacts: {
          ...state.artefacts,
          [action.key]: (state.artefacts[action.key] ?? []).map((artefact) =>
            artefact.id === action.artefactId ? { ...artefact, caption: action.caption } : artefact,
          ),
        },
      };
    }
    case "artefact/updateNoteKind": {
      return {
        ...state,
        artefacts: {
          ...state.artefacts,
          [action.key]: (state.artefacts[action.key] ?? []).map((artefact) =>
            artefact.id === action.artefactId ? { ...artefact, noteKind: action.noteKind } : artefact,
          ),
        },
      };
    }
    case "hmw/addMany": {
      const uniqueHmws = [...new Set([...state.hmws, ...action.questions])];
      const next: AppState = { ...state, hmws: uniqueHmws };

      if (action.writeToDay1HmwNotes) {
        const key = activityKey("day1", "hmw");
        const existing = next.notes[key]?.trim();
        const block =
          "How Might We (generated)\n" +
          action.questions.map((q) => `- ${q}`).join("\n") +
          (existing ? `\n\n---\n\n${existing}` : "");
        next.notes = { ...next.notes, [key]: block };
      }

      return next;
    }

    case "hmw/delete": {
      return {
        ...state,
        hmws: state.hmws.filter((question) => question !== action.question),
      };
    }

    case "testing/updateSession": {
      const existing = state.testingSessions[action.key] ?? {
        participant: "",
        role: "",
        clarityScore: 3,
        usefulnessScore: 3,
        confidenceScore: 3,
        taskCompletionScore: 3,
        keyQuote: "",
        observedBehaviour: "",
        frictionPoint: "",
        positiveSignal: "",
        recommendation: "",
      };

      return {
        ...state,
        testingSessions: {
          ...state.testingSessions,
          [action.key]: {
            ...existing,
            [action.field]: action.value,
          },
        },
      };
    }

    case "schedule/updateItem": {
      const current =
        state.scheduleOverrides[action.dayId] ??
        sprintDays.find(d => d.id === action.dayId)?.schedule ??
        [];
    
      const next = current.map((item, index) =>
        index === action.index ? { ...item, [action.field]: action.value } : item
      );
    
      return {
        ...state,
        scheduleOverrides: {
          ...state.scheduleOverrides,
          [action.dayId]: next,
        },
      };
    }
    
    case "schedule/toggleBreak": {
      const current =
        state.scheduleOverrides[action.dayId] ??
        sprintDays.find(d => d.id === action.dayId)?.schedule ??
        [];
    
      const next = current.map((item, index) =>
        index === action.index ? { ...item, isBreak: !item.isBreak } : item
      );
    
      return {
        ...state,
        scheduleOverrides: {
          ...state.scheduleOverrides,
          [action.dayId]: next,
        },
      };
    }
    
    case "schedule/addItem": {
      const current =
        state.scheduleOverrides[action.dayId] ??
        sprintDays.find(d => d.id === action.dayId)?.schedule ??
        [];
    
      const next = [
        ...current,
        { time: "9:00 AM", title: "New item", duration: "30 min" },
      ];
    
      return {
        ...state,
        scheduleOverrides: {
          ...state.scheduleOverrides,
          [action.dayId]: next,
        },
      };
    }
    
    case "schedule/removeItem": {
      const current =
        state.scheduleOverrides[action.dayId] ??
        sprintDays.find(d => d.id === action.dayId)?.schedule ??
        [];
    
      const next = current.filter((_, index) => index !== action.index);
    
      return {
        ...state,
        scheduleOverrides: {
          ...state.scheduleOverrides,
          [action.dayId]: next,
        },
      };
    }
    
case "schedule/moveItem": {
      const current = [
        ...(state.scheduleOverrides[action.dayId] ??
          sprintDays.find(d => d.id === action.dayId)?.schedule ??
          []),
      ];

      const targetIndex =
        action.direction === "up" ? action.index - 1 : action.index + 1;

      if (targetIndex < 0 || targetIndex >= current.length) return state;

      const [item] = current.splice(action.index, 1);
      current.splice(targetIndex, 0, item);

      return {
        ...state,
        scheduleOverrides: {
          ...state.scheduleOverrides,
          [action.dayId]: current,
        },
      };
    }

    case "schedule/moveItemToDay": {
      if (action.fromDayId === action.toDayId) return state;

      const fromDay = sprintDays.find((day) => day.id === action.fromDayId);
      const toDay = sprintDays.find((day) => day.id === action.toDayId);
      if (!fromDay || !toDay) return state;

      const fromSchedule = state.scheduleOverrides[action.fromDayId] ?? fromDay.schedule;
      const toSchedule = state.scheduleOverrides[action.toDayId] ?? toDay.schedule;
      const item = fromSchedule[action.index];
      if (!item) return state;

      const movedItem = item.activityId && !item.isBreak
        ? { ...item, activityDayId: item.activityDayId ?? action.fromDayId }
        : { ...item };

      return {
        ...state,
        scheduleOverrides: {
          ...state.scheduleOverrides,
          [action.fromDayId]: fromSchedule.filter((_, index) => index !== action.index),
          [action.toDayId]: [...toSchedule, movedItem],
        },
      };
    }
    
    case "schedule/resetDay": {
      const nextOverrides = { ...state.scheduleOverrides };
      delete nextOverrides[action.dayId];
    
      return {
        ...state,
        scheduleOverrides: nextOverrides,
      };
    }

    default: {
      return state;
    }
  }
}

function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-[#070617] text-white hover:bg-slate-800",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-950 hover:bg-slate-50",
        variant === "ghost" && "text-slate-700 hover:bg-slate-100",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Panel({ children, className, ...props }: React.HTMLAttributes<HTMLElement> & { children: React.ReactNode }) {
  return (
    <section
      {...props}
      className={cx("rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]", className)}
    >
      {children}
    </section>
  );
}

function DarkPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-2xl border border-white/10 bg-[#05060f] text-white shadow-xl", className)}>
      {children}
    </section>
  );
}

function Header({
  page,
  onNavigate,
  currentDay,
  sprintName,
  facilitatorMode,
  setFacilitatorMode,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  currentDay: DayId;
  sprintName: string;
  facilitatorMode: boolean;
  setFacilitatorMode: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const isSharedReportView = typeof window !== "undefined" && window.location.pathname.startsWith("/report/");

  if (isSharedReportView) return null;
  const items = [
    { id: "dashboard" as const, label: "Dashboard", icon: Home },
    ...(facilitatorMode
      ? [
          { id: "repository" as const, label: "Repository", icon: BookOpen },
          { id: "resources" as const, label: "Resources", icon: BookOpen },
        ]
      : []),
    ...sprintDays.map((d) => ({ id: d.id as Page, label: d.label, icon: d.icon, colour: d.colour })),
    { id: "timer" as const, label: "Timer", icon: Clock },
  ];

  const nav = (
    <nav className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
      <div className="mx-auto flex w-max min-w-max justify-center gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          const c = "colour" in item && item.colour ? colour[item.colour] : undefined;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cx(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold",
                active ? "bg-[#070617] text-white" : "text-slate-700 hover:bg-slate-100",
                active && c?.solid,
              )}
            >
              <Icon className={cx("h-4 w-4", !active && c?.text)} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );

  return (
    <header className="sticky top-0 z-40 overflow-x-hidden border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 lg:px-6">
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#070617] text-xs font-black text-white">
            DS
          </span>
          <div className="min-w-0">
            <div className="text-sm font-black leading-5">Sprintpilot</div>
            <div className="max-w-[14rem] truncate text-xs font-semibold text-slate-500 sm:max-w-[18rem] xl:max-w-none">
              {sprintName || "Design Sprint"}
            </div>
          </div>
        </button>

        {!facilitatorMode ? (
          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            {nav}
          </div>
        ) : null}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="hidden rounded-lg border px-3 py-1 text-xs font-bold xl:inline-flex">
            Day {currentDay.replace("day", "")}/4
          </span>
          <Button
            variant={facilitatorMode ? "primary" : "secondary"}
            className="whitespace-nowrap px-3 py-1.5"
            onClick={() => {
              if (facilitatorMode) {
                setFacilitatorMode(false);
                if (page === "resources" || page === "repository" || page === "report") onNavigate("dashboard");
                return;
              }

              setFacilitatorMode(true);
            }}
          >
            <Wrench className="h-4 w-4" />
            Facilitator
            {facilitatorMode ? <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-black">ON</span> : null}
          </Button>
          <Button variant="secondary" className="hidden px-3 py-1.5 sm:flex" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {facilitatorMode ? (
        <div className="border-t bg-white/95 px-4 py-2 lg:px-6 xl:hidden">
          {nav}
        </div>
      ) : null}

      {facilitatorMode ? (
        <div className="hidden border-t bg-white/95 xl:block">
          <div className="mx-auto max-w-[1440px] px-6 py-2">
            {nav}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function RepositoryPage({
  activeSessionId,
  currentState,
  dispatch,
  setActiveSessionId,
  onNavigate,
}: {
  activeSessionId: string | null;
  currentState: AppState;
  dispatch: React.Dispatch<Action>;
  setActiveSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  onNavigate: (page: Page) => void;
}) {
  const [sessions, setSessions] = useState<SprintSession[]>([]);

  const refreshSessions = async () => {
    const localSessions = readStoredSessions();
    const syncedLocalSessions = localSessions.length > 0 ? await syncLocalSessionsToCloud(localSessions) : [];
    const cloudSessions = await fetchCloudSessions();
    const mergedSessions = [...cloudSessions, ...syncedLocalSessions].filter(
      (session, index, all) => all.findIndex((item) => item.id === session.id) === index,
    );

    const sortedSessions = mergedSessions.sort((a, b) => b.updatedAt - a.updatedAt);
    setSessions(sortedSessions);
    writeStoredSessions(sortedSessions);
  };

  useEffect(() => {
    void refreshSessions();
  }, []);

  const saveCurrentSession = () => {
    if (activeSessionId) saveSessionState(activeSessionId, currentState);
  };

  const openSession = (session: SprintSession) => {
    saveCurrentSession();
    window.localStorage.setItem(SPRINTPILOT_ACTIVE_SESSION_KEY, session.id);
    setActiveSessionId(session.id);
    dispatch({ type: "session/replace", state: session.state });
    onNavigate("dashboard");
  };

  const createNewSession = async () => {
    saveCurrentSession();

    const nextState: AppState = {
      ...initialState,
      sprintName: "Untitled design sprint",
      challenge: "",
      targetUsers: "",
      desiredOutcome: "",
      completed: [],
      notes: {},
      artefacts: {},
      hmws: [],
      testingSessions: {},
      runningActivityId: undefined,
    };

    const cloudSession = await createCloudSession(nextState, "draft");
    const newSession = cloudSession ?? createSprintSession(nextState, { status: "draft" });

    writeStoredSessions([newSession, ...readStoredSessions().filter((session) => session.id !== newSession.id)]);
    window.localStorage.setItem(SPRINTPILOT_ACTIVE_SESSION_KEY, newSession.id);
    setActiveSessionId(newSession.id);
    dispatch({ type: "session/replace", state: newSession.state });
    await refreshSessions();
    onNavigate("dashboard");
  };

  // --- Repository v1 Pass 1C controls ---
  const duplicateSession = async (session: SprintSession) => {
    saveCurrentSession();

    const duplicatedState: AppState = {
      ...session.state,
      sprintName: `${session.name || session.state.sprintName || "Untitled sprint"} copy`,
      runningActivityId: undefined,
    };

    const cloudSession = await createCloudSession(duplicatedState, "draft");
    const duplicated = cloudSession ?? createSprintSession(duplicatedState, { status: "draft" });

    writeStoredSessions([duplicated, ...readStoredSessions().filter((item) => item.id !== duplicated.id)]);
    await refreshSessions();
  };

  const updateSessionStatus = async (session: SprintSession, status: SprintSessionStatus) => {
    await updateCloudSession(session.cloudId ?? session.id, session.state, status);

    const nextSessions = readStoredSessions().map((item) =>
      item.id === session.id ? { ...item, status, updatedAt: Date.now() } : item,
    );

    writeStoredSessions(nextSessions);
    await refreshSessions();
  };

  const archiveSession = async (session: SprintSession) => {
    if (session.id === activeSessionId) return;
    await updateSessionStatus(session, "archived");
  };

  const deleteArchivedSession = async (session: SprintSession) => {
    if (session.id === activeSessionId) return;

    if (supabase) {
      const { error } = await supabase.from("sprint_sessions").delete().eq("id", session.cloudId ?? session.id);
      if (error) console.error("Failed to delete cloud sprint session", error);
    }

    writeStoredSessions(readStoredSessions().filter((item) => item.id !== session.id));
    await refreshSessions();
  };

  const visibleSessions = sessions.filter((session) => session.status !== "archived");
  const archivedSessions = sessions.filter((session) => session.status === "archived");
  const liveCount = sessions.filter((session) => session.status === "live").length;
  const completedCount = sessions.filter((session) => session.status === "complete").length;

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex rounded-full border bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-500">
            Facilitator workspace
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Sprint Repository</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Save, reopen, duplicate, archive, and manage design sprint sessions locally. This area is hidden from participant mode.
          </p>
        </div>
        <Button onClick={createNewSession}>
          <Plus className="h-4 w-4" /> New sprint
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Panel className="p-5">
          <div className="text-2xl font-black">{visibleSessions.length}</div>
          <div className="mt-1 text-sm font-semibold text-slate-500">Saved sprints</div>
        </Panel>
        <Panel className="p-5">
          <div className="text-2xl font-black">{liveCount}</div>
          <div className="mt-1 text-sm font-semibold text-slate-500">Live</div>
        </Panel>
        <Panel className="p-5">
          <div className="text-2xl font-black">{completedCount}</div>
          <div className="mt-1 text-sm font-semibold text-slate-500">Complete</div>
        </Panel>
        <Panel className="p-5">
          <div className="text-2xl font-black">{archivedSessions.length}</div>
          <div className="mt-1 text-sm font-semibold text-slate-500">Archived</div>
        </Panel>
      </div>

      <div className="mt-6 space-y-4">
        {visibleSessions.length === 0 ? (
          <Panel className="p-8 text-center">
            <h2 className="text-xl font-black">No saved sprints yet</h2>
            <p className="mt-2 text-slate-500">Create a new sprint to start building your repository.</p>
            <Button className="mt-4" onClick={createNewSession}>
              <Plus className="h-4 w-4" /> New sprint
            </Button>
          </Panel>
        ) : (
          visibleSessions.map((session) => {
            const isActive = activeSessionId === session.id;
            const progressCount = session.state.completed.length;
            const artefactCount = Object.values(session.state.artefacts).reduce((total, items) => total + items.length, 0);
            const updated = new Date(session.updatedAt).toLocaleString();
            const challenge = session.state.challenge || "No challenge statement added yet.";

            return (
              <Panel key={session.id} className={cx("p-5", isActive && "border-2 border-emerald-500 bg-emerald-50/40")}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-black">{session.name || session.state.sprintName || "Untitled sprint"}</h2>
                      {isActive ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">Current</span> : null}
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black capitalize text-slate-600">{session.status}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{challenge}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                      <span>Updated {updated}</span>
                      <span>{dayLabel(session.state.currentDay)}</span>
                      <span>{progressCount} completed activities</span>
                      <span>{session.state.hmws.length} HMWs</span>
                      <span>{artefactCount} artefacts</span>
                      <span>{session.cloudId ? "Cloud synced" : "Local only"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => openSession(session)}>
                      <Eye className="h-4 w-4" /> Open
                    </Button>
                    <Button variant="secondary" onClick={() => duplicateSession(session)}>
                      <Copy className="h-4 w-4" /> Duplicate
                    </Button>
                    <select
                      value={session.status}
                      onChange={(event) => updateSessionStatus(session, event.target.value as SprintSessionStatus)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                      aria-label="Sprint status"
                    >
                      <option value="draft">Draft</option>
                      <option value="live">Live</option>
                      <option value="complete">Complete</option>
                      <option value="archived">Archived</option>
                    </select>
                    <Button
                      variant="ghost"
                      onClick={() => archiveSession(session)}
                      disabled={isActive}
                      title={isActive ? "Open another sprint before archiving this one" : "Archive sprint"}
                    >
                      Archive
                    </Button>
                  </div>
                </div>
              </Panel>
            );
          })
        )}
      </div>
      {archivedSessions.length > 0 ? (
        <details className="mt-6 rounded-2xl border bg-white p-5">
          <summary className="cursor-pointer font-black">Archived sprints ({archivedSessions.length})</summary>
          <div className="mt-4 space-y-3">
            {archivedSessions.map((session) => (
              <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-slate-50 p-3">
                <div>
                  <div className="font-black">{session.name || session.state.sprintName || "Untitled sprint"}</div>
                  <div className="text-sm text-slate-500">Updated {new Date(session.updatedAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => updateSessionStatus(session, "draft")}>Restore</Button>
                  <Button variant="secondary" onClick={() => duplicateSession(session)}>Duplicate</Button>
                  <Button variant="ghost" onClick={() => deleteArchivedSession(session)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </main>
  );
}

function ParticipantView({ state }: { state: AppState }) {
  const activeContext = useMemo(() => {
    if (!state.runningActivityId) return null;

    for (const day of sprintDays) {
      const activity = day.activities.find((a) => activityKey(day.id, a.id) === state.runningActivityId);
      if (activity) return { day, activity };
    }

    return null;
  }, [state.runningActivityId]);

  const day = activeContext?.day ?? sprintDays.find((item) => item.id === state.currentDay) ?? sprintDays[0];
  const activity = activeContext?.activity;
  const Icon = day.icon;
  const c = colour[day.colour];

  return (
    <main className="min-h-screen bg-[#05060f] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <div className={cx("flex h-11 w-11 items-center justify-center rounded-2xl", c.solid)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-black uppercase tracking-wide text-white/50">Live Sprint</div>
            <div className="text-lg font-black">{day.label}: {day.title.replace(`${day.label}: `, "")}</div>
          </div>
        </div>
      </div>

      <section className="mx-auto mt-10 flex max-w-[1100px] flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] px-8 py-14 text-center shadow-2xl md:min-h-[620px] md:px-16">
        {activity ? (
          <>
            <div className={cx("rounded-full border px-4 py-2 text-sm font-black", c.soft)}>
              {day.label} activity now running
            </div>
            <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">{activity.title}</h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-white/75">{activity.description}</p>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/10 px-10 py-6 shadow-xl">
              <div className="text-xs font-black uppercase tracking-[0.3em] text-white/50">Timebox</div>
              <div className="mt-3 text-5xl font-black tracking-tight text-white md:text-7xl">{activity.duration}</div>
            </div>

            <div className="mt-10 grid w-full max-w-4xl gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <div className="text-xs font-black uppercase tracking-wide text-white/50">Participants</div>
                <div className="mt-2 text-lg font-black">{activity.participants}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <div className="text-xs font-black uppercase tracking-wide text-white/50">Output</div>
                <div className="mt-2 text-lg font-black">{activity.deliverable}</div>
              </div>
            </div>

            <div className="mt-10 w-full max-w-4xl rounded-3xl border border-white/10 bg-[#05060f] p-6 text-left">
              <div className="text-sm font-black uppercase tracking-wide text-white/50">What we are doing now</div>
              <ul className="mt-4 grid gap-3 text-base leading-7 text-white/80 md:grid-cols-2">
                {activity.tips.slice(0, 4).map((tip) => (
                  <li key={tip} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-400" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-wide text-white/60">
              Waiting to start
            </div>
            <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">Ready for the next activity</h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-white/75">
              The facilitator will start an activity from the console. This screen will update to show the room what is happening now.
            </p>
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/10 p-6">
              <div className="text-xs font-black uppercase tracking-wide text-white/50">Current sprint day</div>
              <div className="mt-2 text-2xl font-black">{day.title}</div>
              <div className="mt-2 text-white/70">{day.subtitle}</div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Dashboard({
  state,
  dispatch,
  onNavigate,
  openHmw,
  facilitatorMode,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onNavigate: (page: Page) => void;
  openHmw: () => void;
  facilitatorMode: boolean;
}) {

  const allKeys = useMemo(() => {
    const keys: string[] = [];
    for (const day of sprintDays) {
      for (const a of day.activities) keys.push(activityKey(day.id, a.id));
    }
    return keys;
  }, []);

  const progress = useMemo(() => {
    const dayProgress = sprintDays.map((day) => {
      const schedule = state.scheduleOverrides[day.id] ?? day.schedule;
  
      const scheduledKeys = schedule
        .filter((item) => !item.isBreak)
        .map((item) => getActivityForScheduleItem(day, item))
        .filter((resolved): resolved is { day: SprintDay; activity: Activity } => Boolean(resolved))
        .map((resolved) => activityKey(resolved.day.id, resolved.activity.id));
  
      const uniqueScheduledKeys = Array.from(new Set(scheduledKeys));
      const completedCount = uniqueScheduledKeys.filter((key) => state.completed.includes(key)).length;
      const totalCount = uniqueScheduledKeys.length;
      const dayPct = totalCount > 0 ? completedCount / totalCount : 0;
  
      return {
        dayId: day.id,
        total: totalCount,
        completed: completedCount,
        pct: dayPct,
      };
    });
  
    const completedActivities = dayProgress.reduce((sum, day) => sum + day.completed, 0);
    const totalActivities = dayProgress.reduce((sum, day) => sum + day.total, 0);
  
    const pct = dayProgress.reduce(
      (sum, day) => sum + day.pct * (100 / sprintDays.length),
      0,
    );
  
    return {
      total: totalActivities,
      count: completedActivities,
      pct: Math.round(Math.max(0, Math.min(100, pct))),
      dayProgress,
    };
  }, [state.completed, state.scheduleOverrides]);

  const activeActivity = useMemo(() => {
    if (!state.runningActivityId) return null;
    for (const day of sprintDays) {
      const activity = day.activities.find((a) => activityKey(day.id, a.id) === state.runningActivityId);
      if (activity) return { day, activity };
    }
    return null;
  }, [state.runningActivityId]);

  const activeActivityKey = activeActivity ? activityKey(activeActivity.day.id, activeActivity.activity.id) : undefined;
  const activeActivityIsComplete = activeActivityKey ? state.completed.includes(activeActivityKey) : false;
  const activeScheduleItem = activeActivity
    ? (state.scheduleOverrides[activeActivity.day.id] ?? activeActivity.day.schedule).find((item) => {
        if (item.isBreak) return false;
        if (item.activityId === activeActivity.activity.id) return true;

        const scheduleTitle = item.title.toLowerCase();
        const activityTitle = activeActivity.activity.title.toLowerCase();
        return scheduleTitle.includes(activityTitle) || activityTitle.includes(scheduleTitle);
      })
    : undefined;
  const activeDurationLabel = activeScheduleItem?.duration ?? activeActivity?.activity.duration;
  const activeDisplayTitle = activeScheduleItem?.title ?? activeActivity?.activity.title;
  const countdown = useActivityCountdown(state);
  const nextRunnableActivity = useMemo(() => {
    const currentDayIndex = sprintDays.findIndex((day) => day.id === state.currentDay);
    const orderedDays = currentDayIndex >= 0
      ? [...sprintDays.slice(currentDayIndex), ...sprintDays.slice(0, currentDayIndex)]
      : sprintDays;

    for (const day of orderedDays) {
      const schedule = state.scheduleOverrides[day.id] ?? day.schedule;

      for (const item of schedule) {
        if (item.isBreak) continue;

        const resolved = getActivityForScheduleItem(day, item);
        if (!resolved) continue;

        const key = activityKey(resolved.day.id, resolved.activity.id);
        if (!state.completed.includes(key)) {
          return { day: resolved.day, activity: resolved.activity, key };
        }
      }
    }

    return null;
  }, [state.completed, state.currentDay, state.scheduleOverrides]);

  // --- Auto-scroll running activity into view in Today's schedule ---
const todayScheduleScrollRef = useRef<HTMLDivElement | null>(null);
const todayScheduleItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

useEffect(() => {
  const runningActivityId = state.runningActivityId;
  if (!runningActivityId) return;

  const timer = window.setTimeout(() => {
    const container = todayScheduleScrollRef.current;
    const activeScheduleItem = todayScheduleItemRefs.current[runningActivityId];
    if (!container || !activeScheduleItem) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = activeScheduleItem.getBoundingClientRect();
    const scrollOffset =
      itemRect.top -
      containerRect.top +
      container.scrollTop -
      container.clientHeight / 2 +
      itemRect.height / 2;

    container.scrollTo({
      top: Math.max(0, scrollOffset),
      behavior: "smooth",
    });
  }, 150);

  return () => window.clearTimeout(timer);
}, [state.runningActivityId]);

  // Participant colour tone helper
  const participantColour = activeActivity?.day.colour ?? sprintDays.find((day) => day.id === state.currentDay)?.colour ?? "green";
  const participantTone =
    participantColour === "blue"
      ? {
          page: "bg-[#05060f]",
          card: "border-blue-400/30 bg-blue-400/10",
          pill: "bg-blue-300 text-slate-950",
          timerText: "text-blue-300",
          progress: "bg-blue-300",
          softText: "text-blue-50",
          softLabel: "text-blue-100",
        }
      : participantColour === "orange"
      ? {
          page: "bg-[#05060f]",
          card: "border-orange-400/30 bg-orange-400/10",
          pill: "bg-orange-300 text-slate-950",
          timerText: "text-orange-300",
          progress: "bg-orange-300",
          softText: "text-orange-50",
          softLabel: "text-orange-100",
        }
      : participantColour === "purple"
      ? {
          page: "bg-[#05060f]",
          card: "border-purple-400/30 bg-purple-400/10",
          pill: "bg-purple-300 text-slate-950",
          timerText: "text-purple-300",
          progress: "bg-purple-300",
          softText: "text-purple-50",
          softLabel: "text-purple-100",
        }
      : {
          page: "bg-[#05060f]",
          card: "border-emerald-400/30 bg-emerald-400/10",
          pill: "bg-emerald-300 text-slate-950",
          timerText: "text-emerald-300",
          progress: "bg-emerald-300",
          softText: "text-emerald-50",
          softLabel: "text-emerald-100",
        };

  // Alarm effect for participant dashboard timer
  const alarmKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (facilitatorMode || !activeActivityKey || !state.runningActivityStartedAt) return;

    const alarmKey = `${activeActivityKey}-${state.runningActivityStartedAt}-${state.runningActivityDurationSeconds ?? 0}`;

    if (!countdown.isOvertime || alarmKeyRef.current === alarmKey) return;

    alarmKeyRef.current = alarmKey;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const beepTimes = [0, 0.45, 0.9, 1.35, 1.8];

    beepTimes.forEach((time) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + time);
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.25, audioContext.currentTime + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + time + 0.22);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + time);
      oscillator.stop(audioContext.currentTime + time + 0.24);
    });

    window.setTimeout(() => {
      void audioContext.close();
    }, 2600);
  }, [activeActivityKey, countdown.isOvertime, facilitatorMode, state.runningActivityDurationSeconds, state.runningActivityStartedAt]);

  if (!facilitatorMode) {
    const waitingMessage = (() => {
      const currentDay = sprintDays.find((day) => day.id === state.currentDay) ?? sprintDays[0];
      const daySchedule = state.scheduleOverrides[currentDay.id] ?? currentDay.schedule;
      const completed = new Set(state.completed);

      const runnableItems = daySchedule
        .map((item) => ({ item, resolved: item.isBreak ? null : getActivityForScheduleItem(currentDay, item) }))
        .filter((entry): entry is { item: any; resolved: { day: SprintDay; activity: Activity } } => Boolean(entry.resolved));

      const completedActivityCount = runnableItems.filter((entry) => completed.has(activityKey(entry.resolved.day.id, entry.resolved.activity.id))).length;
      const nextRunnableItem = runnableItems.find((entry) => !completed.has(activityKey(entry.resolved.day.id, entry.resolved.activity.id)));
      const nextTitle = nextRunnableItem?.item.title ?? nextRunnableItem?.resolved.activity.title;
      const allActivitiesComplete = runnableItems.length > 0 && completedActivityCount >= runnableItems.length;

      if (allActivitiesComplete) {
        return {
          eyebrow: "Day complete",
          title: `Great work — ${currentDay.label} is wrapped up 🎉`,
          body: "Your facilitator will guide the next step when the team is ready.",
        };
      }

      if (completedActivityCount === 0) {
        return {
          eyebrow: "Waiting",
          title: "Your friendly facilitator will start the activity shortly 🤓",
          body: nextTitle
            ? `First up: ${nextTitle}. Keep this screen visible for the sprint flow.`
            : "Keep this screen visible for the current activity, instructions, and sprint flow.",
        };
      }

      // Day 1
      if (currentDay.id === "day1") {
        const day1Messages = [
          {
            eyebrow: "Momentum building",
            title: nextTitle ? `Next up: ${nextTitle}.` : "The sprint is gathering momentum.",
            body: "The room is building a shared understanding of the challenge before moving into solution creation.",
          },
          {
            eyebrow: "Ideas taking shape",
            title: nextTitle ? `The team is ready to move into ${nextTitle}.` : "The team is moving into solution work.",
            body: "Insights are beginning to turn into themes, opportunities, and early solution directions.",
          },
          {
            eyebrow: "Creative energy",
            title: nextTitle ? `${nextTitle} is coming up next.` : "The sprint is moving into ideation.",
            body: "Different perspectives and rough concepts are starting to evolve into stronger ideas.",
          },
        ];
        return day1Messages[completedActivityCount % day1Messages.length];
      }

      // Day 2
      if (currentDay.id === "day2") {
        const day2Messages = [
          {
            eyebrow: "Decision time",
            title: nextTitle ? `Next up: ${nextTitle}.` : "The team is narrowing in on a direction.",
            body: "Today is about choosing carefully and aligning around one approach worth testing.",
          },
          {
            eyebrow: "Story taking shape",
            title: nextTitle ? `${nextTitle} is coming up shortly.` : "The storyboard is coming together.",
            body: "The sprint is shifting from abstract ideas into a concrete experience users can move through.",
          },
          {
            eyebrow: "Aligning the experience",
            title: nextTitle ? `The room is preparing for ${nextTitle}.` : "The experience flow is becoming clearer.",
            body: "Every step is helping the team shape one joined-up user journey for prototyping tomorrow.",
          },
        ];
        return day2Messages[completedActivityCount % day2Messages.length];
      }

      // Day 3
      if (currentDay.id === "day3") {
        const day3Messages = [
          {
            eyebrow: "Prototype mode",
            title: nextTitle ? `Next up: ${nextTitle}.` : "The prototype build is underway.",
            body: "The focus today is speed, clarity, and realism — not perfection.",
          },
          {
            eyebrow: "Building together",
            title: nextTitle ? `${nextTitle} is up next.` : "The prototype is evolving quickly.",
            body: "Different pieces are starting to connect into a believable experience users can react to.",
          },
          {
            eyebrow: "Making it tangible",
            title: nextTitle ? `The team is moving into ${nextTitle}.` : "The prototype is taking shape.",
            body: "The sprint is transforming ideas from the storyboard into something visible and testable.",
          },
        ];
        return day3Messages[completedActivityCount % day3Messages.length];
      }

      // Day 4 (default)
      const day4Messages = [
        {
          eyebrow: "Listening closely",
          title: nextTitle ? `Next up: ${nextTitle}.` : "User feedback is starting to surface.",
          body: "The most useful insights often come from moments of hesitation, confusion, or surprise.",
        },
        {
          eyebrow: "Real reactions",
          title: nextTitle ? `${nextTitle} is coming up next.` : "The team is gathering live evidence.",
          body: "Today replaces assumptions with direct observation and honest user behaviour.",
        },
        {
          eyebrow: "Evidence gathering",
          title: nextTitle ? `The room is preparing for ${nextTitle}.` : "The sprint is uncovering valuable signals.",
          body: "Patterns are beginning to emerge that will help the team decide what happens after the sprint.",
        },
      ];
      return day4Messages[completedActivityCount % day4Messages.length];
    })();

    return (
      <main className={cx("relative min-h-[calc(100vh-68px)] overflow-hidden px-5 py-8 text-white sm:px-6 md:px-10 lg:px-16", participantTone.page)}>
        <div
          className={cx(
            "absolute right-4 top-6 z-10 max-w-[calc(100vw-2rem)] rounded-[1.5rem] border border-white/10 bg-[#0b1020]/80 px-5 py-4 text-right shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-700 sm:right-6 lg:right-10 xl:right-14",
            countdown.isOvertime && "animate-pulse !border-red-300/40 !bg-red-400/15",
          )}
        >
          <div className={cx("text-center text-[10px] font-black uppercase tracking-[0.25em]", countdown.isOvertime ? "text-red-200" : "text-slate-300")}>
            {activeActivity ? (countdown.isOvertime ? "Time's up" : "Time remaining") : "Timer"}
          </div>
          <button
            type="button"
            onClick={() => onNavigate("timer")}
            className={cx(
              "mt-1 block w-full cursor-pointer rounded-xl text-center text-4xl font-black leading-none transition-all duration-500 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40",
              countdown.isOvertime ? "text-red-300" : participantTone.timerText,
            )}
            aria-label="Open timer page"
          >
            {activeActivity ? formatCountdown(countdown.remainingSeconds) : "--:--"}
          </button>
          <div className="mt-2 text-center text-xs font-semibold text-slate-300">
            {activeActivity ? activeDurationLabel : "Starts with activity"}
          </div>
          {activeActivity ? (
            <div className="mt-3 w-40">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>Start</span>
                <span>End</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className={cx("h-full rounded-full transition-all duration-700 ease-out", countdown.isOvertime ? "bg-red-300" : participantTone.progress)}
                  style={{ width: `${countdown.isOvertime ? 100 : countdown.progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
<div
  className={cx(
    "mx-auto flex min-h-[calc(100vh-150px)] max-w-[1360px]",
    activeActivity ? "items-start pt-24 md:pt-28 lg:pt-4" : "items-center pt-8 md:pt-10 lg:pt-0",
  )}
>
          <section className="grid w-full min-w-0 gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] lg:items-start xl:gap-14">
            <div
              className={cx(
                "min-w-0 max-w-none self-start pr-0 lg:max-w-[980px] lg:self-start lg:pr-14",
                activeActivity ? "lg:pt-10 xl:pt-16" : "lg:pt-0",
              )}
            >

              <h1 className="mt-0 max-w-5xl text-5xl font-black leading-none tracking-tight sm:text-6xl md:text-7xl lg:text-[4.75rem] xl:text-[5.6rem]">
                {state.sprintName || "Design Sprint"}
              </h1>

              <p className="mt-6 max-w-4xl text-xl leading-8 text-slate-300 sm:text-2xl sm:leading-9 lg:max-w-3xl xl:mt-8">
                {state.challenge || "Follow the facilitator’s lead as the sprint moves through each activity."}
              </p>

              {activeActivity ? (
                <div className={cx("mt-8 max-w-4xl rounded-[2rem] border p-6 shadow-2xl shadow-black/20 lg:max-w-[760px] lg:p-7 xl:mt-12", participantTone.card)}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cx("rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide", participantTone.pill)}>
                      Now in play
                    </span>
                    <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
                      {activeActivity.day.label}
                    </span>
                    <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
                      {activeDurationLabel}
                    </span>
                    {activeActivityIsComplete ? (
                      <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950">Completed</span>
                    ) : null}
                  </div>

                  <h2 className="mt-7 text-4xl font-black tracking-tight md:text-5xl">{activeDisplayTitle}</h2>
                  <p className={cx("mt-5 max-w-3xl text-lg leading-8", participantTone.softText)}>{activeActivity.activity.description}</p>

                  <div className="mt-7 rounded-2xl bg-white/10 p-5">
                    <div className={cx("text-xs font-black uppercase tracking-wide", participantTone.softLabel)}>What we’re aiming to produce</div>
                    <p className="mt-3 text-xl font-bold leading-8 text-white">{activeActivity.activity.deliverable}</p>
                  </div>

                  <Button
                    className="mt-7 bg-white text-slate-950 hover:bg-slate-100"
                    variant="secondary"
                    onClick={() => {
                      onNavigate(activeActivity.day.id);
                      window.setTimeout(() => {
                        window.dispatchEvent(
                          new CustomEvent("sprintpilot:viewActivity", {
                            detail: { dayId: activeActivity.day.id, activityId: activeActivity.activity.id },
                          }),
                        );
                      }, 0);
                    }}
                  >
                    <Play className="h-4 w-4" /> View activity
                  </Button>
                </div>
              ) : (
                <div className="mt-8 max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-7 lg:max-w-[760px] xl:mt-12">
                  <div className="text-xs font-black uppercase tracking-wide text-slate-400">{waitingMessage.eyebrow}</div>
                  <h2 className="mt-4 text-4xl font-black">{waitingMessage.title}</h2>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">{waitingMessage.body}</p>
                </div>
              )}
            </div>

            {(() => {
  const scheduleDay = activeActivity?.day ?? sprintDays.find((item) => item.id === state.currentDay) ?? sprintDays[0];
  const schedule = state.scheduleOverrides[scheduleDay.id] ?? scheduleDay.schedule;
  const scheduleColour = colour[scheduleDay.colour];

  return (
    <aside className="min-w-0 self-center rounded-[2rem] bg-white p-6 text-slate-950 shadow-2xl shadow-black/30 sm:p-7 lg:self-center lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">Today’s schedule</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {scheduleDay.label}: {scheduleDay.title.replace(`${scheduleDay.label}: `, "")}
          </p>
        </div>
        <span className={cx("rounded-full px-3 py-1 text-xs font-black", scheduleColour.soft)}>
          {scheduleDay.label}
        </span>
      </div>

      <div ref={todayScheduleScrollRef} className="mt-5 max-h-[380px] space-y-2 overflow-y-auto pr-1">
        {schedule.map((item, index) => {
          const resolved = getActivityForScheduleItem(scheduleDay, item);
          const linkedActivity = resolved?.activity;
          const linkedActivityDay = resolved?.day ?? scheduleDay;
          const itemKey = linkedActivity ? activityKey(linkedActivityDay.id, linkedActivity.id) : undefined;
          const isRunningScheduleItem = Boolean(itemKey && state.runningActivityId === itemKey);
          const isComplete = Boolean(itemKey && state.completed.includes(itemKey));

          return (
            <div
              key={`${scheduleDay.id}-participant-schedule-${index}`}
              ref={(element) => {
                if (itemKey) todayScheduleItemRefs.current[itemKey] = element;
              }}
              className={cx(
                "rounded-2xl border px-5 py-4 transition",
                item.isBreak ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white",
                isRunningScheduleItem && "border-2 border-slate-950 bg-white shadow-sm",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 rounded-xl border bg-white px-3 py-1.5 text-sm font-black text-slate-700 shadow-sm">
                  {item.time}
                </span>
                <span className="shrink-0 text-sm font-black text-slate-500">{item.duration}</span>
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div className={cx("min-w-0 truncate text-xl font-black", item.isBreak ? "text-slate-500" : "text-slate-950")}>
                  {item.title}
                </div>

                {isRunningScheduleItem ? (
                  <span className={cx("shrink-0 rounded-full px-4 py-2 text-sm font-black", scheduleColour.soft)}>
                    Running now
                  </span>
                ) : isComplete ? (
                  <span className="shrink-0 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white">
                    Completed
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <Button className="mt-5 w-full" variant="secondary" onClick={() => onNavigate(scheduleDay.id)}>
        <Play className="h-4 w-4" /> View activity
      </Button>
    </aside>
  );
})()}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">{state.sprintName || "Design Sprint Facilitator"}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
        {facilitatorMode
          ? "A facilitator-friendly 4-day design sprint workspace. Run activities, capture notes, generate HMWs, and prepare the report."
          : "A participant-focused sprint workspace. Follow the agenda, understand what is happening now, and stay clear on the next activity."}
      </p>
      <div
        className={cx(
          "mx-auto mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black",
          facilitatorMode
            ? "border-slate-900 bg-slate-950 text-white"
            : "border-blue-200 bg-blue-50 text-blue-700"
        )}
      >
        {facilitatorMode ? <Wrench className="h-4 w-4" /> : <Users className="h-4 w-4" />}
        {facilitatorMode ? "Facilitator mode active" : "Participant view"}
      </div>
      </div>

      <Panel className={cx("mt-8 overflow-hidden p-0 transition-all duration-700", activeActivity && "border-2", activeActivity && participantTone.card)}>
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">

          {/* LEFT SIDE */}
          <div className="flex h-full flex-col p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-4">
              <span className={cx(
                "rounded-full px-5 py-2 text-sm font-black uppercase tracking-wide",
                activeActivity ? participantTone.pill : "bg-slate-100 text-slate-600"
              )}>
                {activeActivity ? "Live now" : "Ready"}
              </span>

              <span className="text-lg font-black text-slate-900">
                {activeActivity ? `${activeActivity.day.label}: ${activeDisplayTitle}` : "No activity running"}
              </span>
            </div>

            <div className="mt-10 text-sm font-black tracking-[0.08em] text-slate-500">
            What is happening now
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {activeActivity ? activeDisplayTitle : "Ready to begin"}
            </h2>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              {activeActivity
                ? activeActivity.activity.description
                : "The facilitator will start the next activity when the room is ready."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3 lg:mt-auto lg:pt-8">
        {activeActivity ? (
          <>
            <Button
              className="w-fit self-start"
              variant="secondary"
              onClick={() => {
                onNavigate(activeActivity.day.id);
                window.setTimeout(() => {
                  window.dispatchEvent(
                    new CustomEvent("sprintpilot:viewActivity", {
                      detail: {
                        dayId: activeActivity.day.id,
                        activityId: activeActivity.activity.id,
                      },
                    }),
                  );
                }, 0);
              }}
            >
              <Play className="h-4 w-4" /> View activity
            </Button>
            <Button
                className="w-fit self-start"
                variant="secondary"
                onClick={() =>
                  dispatch({
                    type: "activity/complete",
                    key: activityKey(activeActivity.day.id, activeActivity.activity.id),
                  })
                }
              >
                <CheckCircle2 className="h-4 w-4" /> Complete activity
              </Button>
            </>
            ) : nextRunnableActivity ? (
              <Button
                className="w-fit self-start"
                variant="primary"
                onClick={() => dispatch({ type: "activity/run", key: nextRunnableActivity.key })}
              >
                <Play className="h-4 w-4" /> Run next activity
              </Button>
            ) : null}
          </div>
          </div>

         {/* RIGHT SIDE */}
          <div className={cx(
            "flex h-full flex-col border-t p-8 md:p-10 lg:border-l lg:border-t-0",
            activeActivity ? "bg-slate-50" : "bg-slate-50"
          )}>

            <div className="text-sm font-black tracking-[0.08em] text-slate-500">
              Current focus
            </div>

            <div className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {activeActivity
                ? countdown.isOvertime
                  ? "Time up"
                  : `${formatCountdown(countdown.remainingSeconds)} remaining`
                : dayLabel(state.currentDay)}
            </div>

            {activeActivity ? (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <span>Start</span>
                  <span>End</span>
                </div>

                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                  <div
                    className={cx(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      countdown.isOvertime ? "bg-red-300" : participantTone.progress
                    )}
                    style={{ width: `${countdown.isOvertime ? 100 : countdown.progressPercent}%` }}
                  />
                </div>
              </div>
            ) : null}

            <p className="mt-5 text-base leading-7 text-slate-600">
              {activeActivity
                ? activeActivity.activity.deliverable
                : "Use the day cards below to follow the sprint."}
            </p>

            {activeActivity && (
            <div className="mt-6 flex flex-wrap gap-2 lg:mt-auto">
              <Button
                variant="secondary"
                onClick={() => dispatch({ type: state.runningActivityPausedAt ? "activity/resume" : "activity/pause" })}
              >
                {state.runningActivityPausedAt ? (
                  <>
                    <Play className="h-4 w-4" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" /> Pause
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                onClick={() => dispatch({ type: "activity/addTime", seconds: 5 * 60 })}
              >
                +5 min
              </Button>

              <Button
                variant="secondary"
                onClick={() => dispatch({ type: "activity/addTime", seconds: 10 * 60 })}
              >
                +10 min
              </Button>
            </div>
            )}
          </div>

        </div>
      </Panel>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <DarkPanel className="border-0 p-6 shadow-2xl ring-1 ring-slate-900/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black">
                <BookOpen className="h-5 w-5" /> Sprint Overview
              </h2>
              <p className="mt-1 text-sm text-white/70">Progress counts activities you’ve completed or captured notes for.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
            {facilitatorMode ? (
              <Button
                variant="secondary"
                className="whitespace-nowrap border-white/10 !bg-white/10 px-3 !text-white hover:!bg-white/15"
                onClick={() => onNavigate("report")}
              >
                <Eye className="h-4 w-4" /> Report
              </Button>
            ) : null}
          </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4" /> 4 Days Total
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" /> 5-7 Participants
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4" /> Validate a Solution
            </div>
          </div>

          <div className="mt-7 grid gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-white/60">Challenge</div>
              <div className="mt-1 text-sm text-white/80">{state.challenge || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-white/60">Target users</div>
              <div className="mt-1 text-sm text-white/80">{state.targetUsers || "—"}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs font-black uppercase tracking-wide text-white/60">Desired outcome</div>
              <div className="mt-1 text-sm text-white/80">{state.desiredOutcome || "—"}</div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
            <span>Sprint Progress</span>
            <span>
              {progress.pct}% ({progress.count}/{progress.total})
            </span>
          </div>
          {activeActivity ? (
            <div className={cx("mt-3 rounded-2xl border p-4 text-sm transition-all duration-700", participantTone.card, participantTone.softText, countdown.isOvertime && "animate-pulse border-red-300/40 bg-red-400/10 text-red-50")}>
              <div className={cx("text-xs font-black uppercase tracking-wide", countdown.isOvertime ? "text-red-200" : participantTone.softLabel)}>Active activity</div>
              <div className="mt-1 font-black">{activeActivity.day.label}: {activeDisplayTitle}</div>
              <div className={cx("mt-1", countdown.isOvertime ? "text-red-100" : participantTone.softLabel)}>{activeActivity.activity.description}</div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              No activity is running. Open a day and choose <strong className="text-white">Run Activity</strong> to move the sprint forward.
            </div>
          )}
          <div className="mt-4">
            <div className="relative h-4 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/10">
              <div
                className="h-4 rounded-full transition-all duration-700 ease-out"
                style={sprintProgressFillStyle(progress.pct)}
              />
              <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>
            </div>
            <div className="mt-2 grid grid-cols-4 text-[11px] font-bold text-white/60">
              <span>Day 1</span>
              <span className="text-center">Day 2</span>
              <span className="text-center">Day 3</span>
              <span className="text-right">Day 4</span>
            </div>
          </div>
        </DarkPanel>

        <SprintSetupPanel
        state={state}
        dispatch={dispatch}
        onNavigate={onNavigate}
        facilitatorMode={facilitatorMode}
      />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {sprintDays.map((day) => (
          <DayCard key={day.id} day={day} currentDay={state.currentDay} runningActivityId={state.runningActivityId} completed={state.completed} onNavigate={onNavigate} />
        ))}
      </div>

      <QuickActions
        state={state}
        onNavigate={onNavigate}
        openHmw={openHmw}
        hmwCount={state.hmws.length}
        facilitatorMode={facilitatorMode}
      />
    </main>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-black">{label}</span>
        {hint ? <span className="text-xs font-semibold text-slate-500">{hint}</span> : null}
      </div>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 min-h-24 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950"
          placeholder={placeholder}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950"
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function SprintSetupPanel({
  state,
  dispatch,
  onNavigate,
  facilitatorMode,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onNavigate: (page: Page) => void;
  facilitatorMode: boolean;
}) {
  const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border bg-slate-50 p-3">
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value || "Not set yet"}</p>
    </div>
  );

  return (
    <Panel className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black">Sprint Setup</h2>
          <p className="mt-1 text-sm text-slate-500">
            {facilitatorMode
              ? "Edit the sprint context used across the dashboard and report."
              : "Sprint context for participants and stakeholders."}
          </p>
        </div>
        {facilitatorMode ? (
        <Button variant="secondary" onClick={() => onNavigate("report")}>
          <Eye className="h-4 w-4" /> Report
        </Button>
        ) : null}
      </div>

      <div className="mt-5 flex flex-1 flex-col space-y-4">
        {facilitatorMode ? (
          <div className="grid gap-4">
            <Field
              label="Sprint name"
              hint="Visible in the header"
              value={state.sprintName}
              onChange={(value) => dispatch({ type: "setup/update", field: "sprintName", value })}
              placeholder="e.g. Onboarding Sprint"
            />
            <Field
              label="Challenge"
              hint="What are we solving?"
              value={state.challenge}
              onChange={(value) => dispatch({ type: "setup/update", field: "challenge", value })}
              placeholder="e.g. Users drop off after step 2"
              textarea
            />
            <Field
              label="Target users"
              hint="Who are we solving for?"
              value={state.targetUsers}
              onChange={(value) => dispatch({ type: "setup/update", field: "targetUsers", value })}
              placeholder="e.g. Busy parents, new PMs..."
            />
            <Field
              label="Desired outcome"
              hint="Success criteria"
              value={state.desiredOutcome}
              onChange={(value) => dispatch({ type: "setup/update", field: "desiredOutcome", value })}
              placeholder="e.g. A testable prototype + learning"
            />
          </div>
        ) : (
          <div className="grid gap-4">
            <ReadOnlyField label="Sprint name" value={state.sprintName} />
            <ReadOnlyField label="Challenge" value={state.challenge} />
            <ReadOnlyField label="Target users" value={state.targetUsers} />
            <ReadOnlyField label="Desired outcome" value={state.desiredOutcome} />
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Current day</div>
          <div className="mt-1 text-sm font-semibold">{dayLabel(state.currentDay)}</div>
        </div>
        <Button variant="secondary" onClick={() => onNavigate(state.currentDay)}>
          <Play className="h-4 w-4" /> Continue
        </Button>
      </div>
    </Panel>
  );
}

function DayCard({ day, currentDay, runningActivityId, completed, onNavigate }: { day: SprintDay; currentDay: DayId; runningActivityId?: string; completed: string[]; onNavigate: (page: Page) => void }) {
  const Icon = day.icon;
  const c = colour[day.colour];
  const active = currentDay === day.id;
  const activeActivity = day.activities.find((activity) => activityKey(day.id, activity.id) === runningActivityId);
  const completedCount = day.activities.filter((activity) => completed.includes(activityKey(day.id, activity.id))).length;

  return (
    <Panel className={cx("p-5", active && "border-2 border-slate-950", activeActivity && "ring-4 ring-emerald-100")}>
      <div className="flex items-start gap-4">
        <div className={cx("rounded-xl p-3", c.solid)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-black">{day.title}</h2>
            {active ? <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">In progress</span> : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">{day.duration}</p>
        </div>
      </div>

      <p className="mt-7 text-sm leading-6 text-slate-700">{day.subtitle}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{completedCount}/{day.activities.length} complete</span>
        {activeActivity ? <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">Running: {activeActivity.title}</span> : null}
      </div>

      <p className="mt-5 text-sm font-black">Key Activities</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {day.activities.slice(0, 4).map((a) => (
          <span key={a.id} className="rounded-md border px-2 py-1 text-xs font-semibold">
            {a.title}
          </span>
        ))}
      </div>

      <Button className="mt-5 w-full" variant={active ? "primary" : "secondary"} onClick={() => onNavigate(day.id)}>
        {active ? "Continue" : "Start"} {day.label}
      </Button>
    </Panel>
  );
}

function QuickActions({
  state,
  onNavigate,
  openHmw,
  hmwCount,
  facilitatorMode,
}: {
  state: AppState;
  onNavigate: (page: Page) => void;
  openHmw: () => void;
  hmwCount: number;
  facilitatorMode: boolean;
}) {
  const activeActivity = useMemo(() => {
    if (!state.runningActivityId) return null;

    for (const day of sprintDays) {
      const activity = day.activities.find((a) => activityKey(day.id, a.id) === state.runningActivityId);
      if (activity) return { day, activity };
    }

    return null;
  }, [state.runningActivityId]);

  const actions: Array<[string, string, React.ElementType, () => void]> = facilitatorMode
    ? [
        activeActivity
          ? ["Active Activity", `${activeActivity.day.label}: ${activeActivity.activity.title}`, Play, () => onNavigate(activeActivity.day.id)]
          : ["Continue Current Day", dayLabel(state.currentDay), Play, () => onNavigate(state.currentDay)],
        ["Saved HMW Questions", hmwCount > 0 ? `${hmwCount} saved` : "No saved questions yet", CheckCircle2, openHmw],
        ["Template Library", "Access worksheets and templates", BookOpen, () => onNavigate("resources")],
        ["Timer & Tools", "Time-boxing utilities", Timer, () => onNavigate("timer")],
        ["Sprint Report", "Summarize sprint data", Star, () => onNavigate("report")],
      ]
    : [
        activeActivity
          ? ["View Active Activity", `${activeActivity.day.label}: ${activeActivity.activity.title}`, Play, () => onNavigate(activeActivity.day.id)]
          : ["Continue Current Day", dayLabel(state.currentDay), Play, () => onNavigate(state.currentDay)],
        ["Timer", "Use the sprint timer", Timer, () => onNavigate("timer")],
      ];

  return (
    <Panel className="mt-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">What do you want to do next?</h2>
          <p className="mt-1 text-sm text-slate-500">
            {facilitatorMode ? "Facilitator shortcuts for running and capturing the sprint." : "Participant-safe shortcuts based on the current sprint flow."}
          </p>
        </div>
        {activeActivity ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Activity running</span> : null}
      </div>

      <div className={cx("mt-5 grid gap-3", facilitatorMode ? "md:grid-cols-5" : "md:grid-cols-2")}>
        {actions.map(([title, desc, Icon, action]) => (
          <button key={title} onClick={action} className="rounded-xl border p-4 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2">
            <Icon className="mb-3 h-4 w-4 text-slate-600" />
            <strong className="block text-sm">{title}</strong>
            <span className="mt-1 block text-sm text-slate-500">{desc}</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function DayPage({
  day,
  state,
  dispatch,
  onNavigate,
  openHmw,
  facilitatorMode,
}: {
  day: SprintDay;
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onNavigate: (page: Page) => void;
  openHmw: () => void;
  facilitatorMode: boolean;
}) {
  const [tab, setTab] = useState<Tab>("schedule");
  const [focusActivityId, setFocusActivityId] = useState<string | undefined>(undefined);
  const [guidanceLevel, setGuidanceLevel] = useState<GuidanceLevel>("standard");

  useEffect(() => {
    if (!facilitatorMode && tab === "resources") {
      setTab("schedule");
    }
  }, [facilitatorMode, tab]);

  useEffect(() => {
    if (facilitatorMode) return;
    if (!state.runningActivityId?.startsWith(`${day.id}-`)) return;

    const activityId = state.runningActivityId.replace(`${day.id}-`, "");
    setFocusActivityId(activityId);
    setTab("activities");
  }, [day.id, facilitatorMode, state.runningActivityId]);

  useEffect(() => {
    const handleViewActivity = (event: Event) => {
      const detail = (event as CustomEvent<{ dayId: DayId; activityId: string }>).detail;
      if (!detail || detail.dayId !== day.id) return;

      setFocusActivityId(detail.activityId);
      setTab("activities");

      window.setTimeout(() => {
        const el = document.getElementById(`activity-${detail.activityId}`);
        if (!el) return;

        const yOffset = -140;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }, 120);

      window.setTimeout(() => {
        setFocusActivityId(undefined);
      }, 900);
    };

    window.addEventListener("sprintpilot:viewActivity", handleViewActivity);
    return () => window.removeEventListener("sprintpilot:viewActivity", handleViewActivity);
  }, [day.id]);

  const openActivityFromSchedule = (activityId: string) => {
    setFocusActivityId(activityId);
    setTab("activities");
  };

  const c = colour[day.colour];
  const Icon = day.icon;
  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <Button variant="secondary" onClick={() => onNavigate("dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <span className="w-fit rounded-lg border bg-white px-3 py-2 text-sm font-bold shadow-sm">{day.duration}</span>
      </div>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight">{day.title}</h1>
            <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">In progress</span>
          </div>
          <div className="mt-2 space-y-2">
            <p className="text-lg text-slate-500">{day.subtitle}</p>

            <div className="mt-3 space-y-1">
              <p className="text-lg font-medium text-slate-700">
                {day.guideLabel.replace(" Guide", "")}
              </p>
              <p className="max-w-3xl text-sm leading-relaxed text-slate-500">
                {day.summary}
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col items-start gap-3 md:w-auto md:items-end">
          {facilitatorMode ? (
            <div className="flex items-center gap-3 rounded-full border border-slate-200/70 bg-white/70 px-2 py-2 shadow-sm backdrop-blur">
              <span className="pl-3 text-xs font-black uppercase tracking-wide text-slate-500">
                Guidance
              </span>

              <div className="inline-flex rounded-full bg-slate-100/80 p-1">
                {(["beginner", "standard", "expert"] as GuidanceLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setGuidanceLevel(level)}
                    className={cx(
                      "rounded-full px-4 py-2 text-sm font-black capitalize transition",
                      guidanceLevel === level
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-950",
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric icon={Icon} label="Goal" value={day.goal} tone={c.text} />
        <Metric icon={Users} label={day.middleLabel} value={day.middle} tone="text-emerald-600" />
        <Metric icon={CheckCircle2} label="Outcome" value={day.outcome} tone="text-orange-600" />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 grid-cols-4 rounded-2xl bg-slate-100 p-1">
        {((facilitatorMode ? ["schedule", "activities", "guide", "resources"] : ["schedule", "activities", "guide"]) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cx(
                "rounded-xl py-2 text-sm font-black capitalize text-slate-700",
                tab === t && "bg-white text-slate-950 shadow-sm",
              )}
            >
              {t === "guide" ? day.guideLabel.replace(" Guide", "") : t}
            </button>
          ))}
        </div>
      </div>

      {tab === "schedule" ? (
          <Schedule
            day={day}
            state={state}
            dispatch={dispatch}
            facilitatorMode={facilitatorMode}
            onOpenActivity={openActivityFromSchedule}
          />
        ) : null}
      {tab === "activities" ? (
        <Activities
          day={day}
          state={state}
          dispatch={dispatch}
          openHmw={openHmw}
          facilitatorMode={facilitatorMode}
          focusActivityId={focusActivityId}
          guidanceLevel={guidanceLevel}
        />
      ) : null}
      {tab === "guide" ? <Guide day={day} /> : null}
      {tab === "resources" ? <DayResources day={day} openHmw={openHmw} /> : null}

      <QuickActions
        state={state}
        onNavigate={onNavigate}
        openHmw={openHmw}
        hmwCount={state.hmws.length}
        facilitatorMode={facilitatorMode}
      />
      </main>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Icon className={cx("h-4 w-4", tone)} />
        <strong>{label}</strong>
      </div>
      <p className="mt-2 text-slate-500">{value}</p>
    </Panel>
  );
}

function Schedule({
  day,
  state,
  dispatch,
  facilitatorMode,
  onOpenActivity,
}: {
  day: SprintDay;
  state: AppState;
  dispatch: React.Dispatch<Action>;
  facilitatorMode: boolean;
  onOpenActivity: (activityId: string) => void;
}) {
  const c = colour[day.colour];
  const schedule = state.scheduleOverrides[day.id] ?? day.schedule;

  return (
    <Panel className="mt-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black">
            <Clock className="h-5 w-5" /> {day.label} Schedule
          </h2>
          {facilitatorMode ? (
            <p className="mt-1 text-sm text-slate-500">Edit timings, breaks, order and custom agenda items for this day.</p>
          ) : null}
        </div>

        {facilitatorMode ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => dispatch({ type: "schedule/addItem", dayId: day.id })}>
              <Plus className="h-4 w-4" /> Add item
            </Button>
            <Button variant="secondary" onClick={() => dispatch({ type: "schedule/resetDay", dayId: day.id })}>
              Reset day
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        {schedule.map((item, index) => {
          // Use shared schedule-item resolver
          const resolved = getActivityForScheduleItem(day, item);
          const activity = resolved?.activity;
          const activityDay = resolved?.day ?? day;
          const isClickable = Boolean(activity && !item.isBreak && !facilitatorMode);
          const key = activity ? activityKey(activityDay.id, activity.id) : "";
          const isActive = Boolean(key && state.runningActivityId === key);
          const isCompleted = Boolean(key && state.completed.includes(key));

          if (facilitatorMode) {
            return (
              <div
                key={`schedule-edit-${day.id}-${index}`}
                className={cx("rounded-xl border p-3", item.isBreak ? c.soft : "border-slate-200 bg-white")}
              >
                <div className="grid gap-3 md:grid-cols-[140px_1fr_140px_auto] md:items-center">
                  <input
                    value={item.time}
                    onChange={(event) => dispatch({ type: "schedule/updateItem", dayId: day.id, index, field: "time", value: event.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-950"
                    aria-label="Schedule item time"
                  />
                  <input
                    value={item.title}
                    onChange={(event) => dispatch({ type: "schedule/updateItem", dayId: day.id, index, field: "title", value: event.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-950"
                    aria-label="Schedule item title"
                  />
                  <input
                    value={item.duration}
                    onChange={(event) => dispatch({ type: "schedule/updateItem", dayId: day.id, index, field: "duration", value: event.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-950"
                    aria-label="Schedule item duration"
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "schedule/moveItem", dayId: day.id, index, direction: "up" })}
                      className="rounded-lg border bg-white px-2 py-1 text-xs font-black text-slate-600 disabled:opacity-40"
                      disabled={index === 0}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "schedule/moveItem", dayId: day.id, index, direction: "down" })}
                      className="rounded-lg border bg-white px-2 py-1 text-xs font-black text-slate-600 disabled:opacity-40"
                      disabled={index === schedule.length - 1}
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "schedule/toggleBreak", dayId: day.id, index })}
                      className="rounded-lg border bg-white px-2 py-1 text-xs font-black text-slate-600"
                    >
                      {item.isBreak ? "Activity" : "Break"}
                    </button>
                    {/* Move-to-day dropdown */}
                    <select
                      value=""
                      onChange={(event) => {
                        const toDayId = event.target.value as DayId;
                        if (!toDayId) return;

                        dispatch({
                          type: "schedule/moveItemToDay",
                          fromDayId: day.id,
                          index,
                          toDayId,
                        });
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-600"
                      aria-label="Move schedule item to another day"
                    >
                      <option value="">Move</option>
                      {DAY_IDS.filter((dayId) => dayId !== day.id).map((dayId) => (
                        <option key={dayId} value={dayId}>
                          {dayLabel(dayId)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "schedule/removeItem", dayId: day.id, index })}
                      className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-black text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={`schedule-view-${day.id}-${index}`}
              type="button"
              disabled={!isClickable}
              onClick={isClickable && activity ? () => onOpenActivity(activity.id) : undefined}
              className={cx(
                "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition",
                item.isBreak ? c.soft : "border-slate-200 bg-white",
                isClickable ? "cursor-pointer hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2" : "cursor-default",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="shrink-0 rounded-lg border bg-white px-2 py-1 text-xs font-black text-slate-800">{item.time}</span>
                <strong className="truncate text-sm">{item.title}</strong>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {isActive ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">Active</span> : null}
                {isCompleted && !isActive ? <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-black text-white">Completed</span> : null}
                {isClickable && !isActive && !isCompleted ? <span className="text-xs font-black text-slate-400">Open activity</span> : null}
                <span className="text-sm font-semibold text-slate-500">{item.duration}</span>
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function FacilitatorConfidenceLayer({
  activity,
  isRunning,
  isDone,
}: {
  activity: Activity;
  isRunning: boolean;
  isDone: boolean;
}) {
  const guide = getGuideByTitle(activity.guideTitle);

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border bg-slate-50 p-3">
        <div className="text-xs font-black uppercase tracking-wide text-slate-500">Confidence cue</div>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {isDone
            ? "Output captured. Check the report evidence before moving on."
            : isRunning
              ? "You are facilitating this now. Keep the timebox visible and capture artefacts before closing."
              : "Start this when the room understands the output expected."}
        </p>
      </div>

      <div className="rounded-xl border bg-slate-50 p-3">
        <div className="text-xs font-black uppercase tracking-wide text-slate-500">Watch for</div>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Debate replacing capture, unclear decisions, or outputs that will not make sense later.
        </p>
      </div>

      <div className="rounded-xl border bg-slate-50 p-3">
        <div className="text-xs font-black uppercase tracking-wide text-slate-500">Before moving on</div>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Capture notes, photos, decisions, risks, questions, or recommendations linked to this activity.
        </p>
        <div className="mt-2 text-xs font-semibold text-slate-500">
          Guide: {guide ? guide.title : activity.guideTitle}
        </div>
      </div>
    </div>
  );
}

function TestingSessionEvidenceCard({
  sessionKey,
  sessionLabel,
  session,
  dispatch,
}: {
  sessionKey: string;
  sessionLabel: string;
  session: TestingSession | undefined;
  dispatch: React.Dispatch<Action>;
}) {
  const value: TestingSession = session ?? {
    participant: "",
    role: "",
    clarityScore: 3,
    usefulnessScore: 3,
    confidenceScore: 3,
    taskCompletionScore: 3,
    keyQuote: "",
    observedBehaviour: "",
    frictionPoint: "",
    positiveSignal: "",
    recommendation: "",
  };

  const update = (field: keyof TestingSession, nextValue: string | number) => {
    dispatch({ type: "testing/updateSession", key: sessionKey, field, value: nextValue });
  };

  const Likert = ({
    label,
    field,
    helper,
  }: {
    label: string;
    field: "clarityScore" | "usefulnessScore" | "confidenceScore" | "taskCompletionScore";
    helper: string;
  }) => (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-slate-900">{label}</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">{helper}</div>
        </div>
        <div className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
          {value[field]}/5
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => update(field, score)}
            className={cx(
              "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-black transition",
              value[field] === score
                ? "border-purple-600 bg-purple-600 text-white shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-purple-300 hover:bg-purple-50",
            )}
            aria-label={`${label}: ${score} out of 5`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-6 rounded-[1.5rem] border border-purple-200 bg-purple-50/70 p-5">
      <div>
        <div className="text-xs font-black uppercase tracking-wide text-purple-700">Testing evidence</div>
        <h3 className="mt-1 text-lg font-black text-slate-950">{sessionLabel}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Capture the strongest evidence from this testing session so the report can summarise Day 4 clearly.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block rounded-2xl border bg-white p-4">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Participant</span>
          <input
            value={value.participant}
            onChange={(event) => update("participant", event.target.value)}
            placeholder="e.g. Participant 1"
            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
          />
        </label>

        <label className="block rounded-2xl border bg-white p-4">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Role / profile</span>
          <input
            value={value.role ?? ""}
            onChange={(event) => update("role", event.target.value)}
            placeholder="e.g. Parent, student, colleague, service user"
            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Likert label="Clarity" field="clarityScore" helper="How clearly did they understand the concept?" />
        <Likert label="Usefulness" field="usefulnessScore" helper="How useful or valuable did it appear to them?" />
        <Likert label="Confidence" field="confidenceScore" helper="How confident did they seem using it?" />
        <Likert label="Task completion" field="taskCompletionScore" helper="How successfully did they complete the test task?" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {([
          ["keyQuote", "Key quote", "Capture a direct quote that best represents the session."],
          ["observedBehaviour", "Observed behaviour", "What did they actually do, hesitate over, skip, repeat, or misunderstand?"],
          ["frictionPoint", "Main friction point", "Where did the experience create confusion, effort, doubt, or resistance?"],
          ["positiveSignal", "Strongest positive signal", "What suggested value, confidence, excitement, or intent?"],
          ["recommendation", "Recommendation", "What should the team change, keep, test, or decide next?"],
        ] as Array<[keyof TestingSession, string, string]>).map(([field, label, placeholder]) => (
          <label key={field} className="block rounded-2xl border bg-white p-4 lg:last:col-span-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
            <p className="mt-1 text-xs leading-5 text-slate-500">{placeholder}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const currentValue = String(value[field] ?? "");
                  update(field, `${currentValue}${currentValue.endsWith("\n") || !currentValue ? "" : "\n"}# Heading text`);
                }}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
              >
                Heading
              </button>

              <button
                type="button"
                onClick={() => {
                  const currentValue = String(value[field] ?? "");
                  update(field, `${currentValue}${currentValue.endsWith("\n") || !currentValue ? "" : "\n"}## Label text`);
                }}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
              >
                Label
              </button>

              <button
                type="button"
                onClick={() => {
                  const currentValue = String(value[field] ?? "");
                  update(field, `${currentValue}${currentValue.endsWith("\n") || !currentValue ? "" : "\n"}- Bullet point`);
                }}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
              >
                Bullet
              </button>

              <button
                type="button"
                onClick={() => {
                  const currentValue = String(value[field] ?? "");
                  update(field, `${currentValue}${currentValue.endsWith("\n") || !currentValue ? "" : "\n"}> Quote text`);
                }}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
              >
                Quote
              </button>

              <button
                type="button"
                onClick={() => {
                  const currentValue = String(value[field] ?? "");
                  update(field, `${currentValue}${currentValue.endsWith(" ") || !currentValue ? "" : " "}**bold text**`);
                }}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
              >
                Bold
              </button>

              <button
                type="button"
                onClick={() => update(field, `${String(value[field] ?? "")}\n\n`)}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
              >
                Space
              </button>
            </div>

            <textarea
              value={String(value[field] ?? "")}
              onChange={(event) => update(field, event.target.value)}
              placeholder="Use the buttons above, or type # for headings, ## for labels, - for bullets, > for quotes, and blank lines for spacing."
              rows={4}
              className="mt-2 min-h-32 w-full resize-y whitespace-pre-wrap rounded-xl border px-3 py-2 text-sm leading-7 outline-none focus:ring-2 focus:ring-purple-200"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function Activities({
  day,
  state,
  dispatch,
  openHmw,
  facilitatorMode,
  focusActivityId,
  guidanceLevel,
}: {
  day: SprintDay;
  state: AppState;
  dispatch: React.Dispatch<Action>;
  openHmw: () => void;
  facilitatorMode: boolean;
  focusActivityId?: string;
  guidanceLevel: GuidanceLevel;
}) {

  useEffect(() => {
    if (!focusActivityId) return;
    const timer = window.setTimeout(() => {
      const el = document.querySelector(`[id^="activity-${focusActivityId}"]`) as HTMLElement | null;
      if (el) {
        const yOffset = -140;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [focusActivityId, day.id]);

  const activeActivityId = state.runningActivityId?.startsWith(`${day.id}-`)
    ? state.runningActivityId.replace(`${day.id}-`, "")
    : undefined;

  useEffect(() => {
    if (facilitatorMode || !activeActivityId) return;

    const timer = window.setTimeout(() => {
      const el = document.querySelector(`[id^="activity-${activeActivityId}"]`) as HTMLElement | null;
      if (el) {
        const yOffset = -140;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [activeActivityId, day.id, facilitatorMode]);

  const c = colour[day.colour];
  const [selectedGuide, setSelectedGuide] = useState<ResourceGuide | null>(null);

  // 1. Add countdown and effect for auto-completion
  const countdown = useActivityCountdown(state);
  useEffect(() => {
    if (!facilitatorMode) return;
    if (!state.runningActivityId || !countdown.isOvertime) return;
    if (state.completed.includes(state.runningActivityId)) return;

    dispatch({ type: "activity/complete", key: state.runningActivityId });
  }, [countdown.isOvertime, dispatch, facilitatorMode, state.completed, state.runningActivityId]);

  const effectiveSchedule = state.scheduleOverrides[day.id] ?? day.schedule;
  const activityScheduleItems = effectiveSchedule.filter((item) => !item.isBreak);

  return (
    <>
      <div className="mt-3 space-y-4">
      {activityScheduleItems.map((item, index) => {
        const resolved = getActivityForScheduleItem(day, item);
        if (!resolved) return null;

        const a = resolved.activity;
        const activityDay = resolved.day;
        const key = activityKey(activityDay.id, a.id);
        const displayTitle = item.title || a.title;
        const scheduledTime = `${item.time} • ${item.duration}`;
        const isRunning = state.runningActivityId === key;
        const isDone = state.completed.includes(key);
        // 2. Add isAutoCompleted and completeButtonIsDone
        const completeButtonIsDone = isDone;
        const notes = state.notes[key] ?? "";
        const artefacts = state.artefacts[key] ?? [];
        const guide = getGuideByTitle(a.guideTitle);
        const watchFors = getActivityWatchFors(a);
        const shouldDeemphasise = !facilitatorMode && Boolean(state.runningActivityId) && state.runningActivityId !== key;

        return (
          <Panel
            key={`${key}-${index}`}
            id={`activity-${a.id}-${index}`}
            className={cx(
              "scroll-mt-24 p-5 transition duration-300",
              focusActivityId === a.id && "ring-4 ring-slate-950/10",
              isRunning && "border-2 border-emerald-500 bg-emerald-50/40 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]",
              isDone && !isRunning && "bg-slate-50",
              shouldDeemphasise && "opacity-55",
            )}
          >
            {facilitatorMode && activityDay.id === "day4" && a.id.startsWith("testing-") ? (
              <TestingSessionEvidenceCard
                sessionKey={key}
                sessionLabel={displayTitle}
                session={state.testingSessions[key]}
                dispatch={dispatch}
              />
            ) : null}
            <div
              className={cx(
                "flex items-start justify-between gap-4",
                activityDay.id === "day4" && a.id.startsWith("testing-") && "pt-5",
              )}
>
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black">
                  <span className={cx("flex h-6 w-6 items-center justify-center rounded-full text-xs", c.solid)}>{index + 1}</span>
                  {displayTitle}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    <Clock className="h-3.5 w-3.5" />
                    {scheduledTime}
                  </div>
                  {isRunning ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Running now</span> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {/* Removed duplicate "Running now" pill here */}
                {facilitatorMode ? (
                  <>
                    {isRunning ? (
                      <Button variant="secondary" onClick={() => dispatch({ type: "activity/stop" })}>
                        <X className="h-4 w-4" /> Stop timer
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => dispatch({ type: "activity/run", key })}
                        disabled={isDone || isRunning}
                      >
                        <Play className="h-4 w-4" /> Run Activity
                      </Button>
                    )}

                    <Button
                      variant={completeButtonIsDone ? "primary" : "secondary"}
                      onClick={() =>
                        dispatch({
                          type: completeButtonIsDone ? "activity/toggleComplete" : "activity/complete",
                          key,
                        })
                      }
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {completeButtonIsDone ? "Completed" : "Complete activity"}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            <p className="mt-7 text-base leading-7 text-slate-700">{a.description}</p>

            {!facilitatorMode ? (
              <p className="mt-3 text-sm font-semibold text-slate-600">
                {isRunning
                  ? "Focus here — this is the activity the room is working on now."
                  : isDone
                  ? "This activity has been completed."
                  : "This activity is coming up in the sprint flow."}
              </p>
            ) : null}

            {/* FacilitatorConfidenceLayer removed */}
            {/* Merged guidance row */}
            {facilitatorMode ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-500">
                    <Mic className="h-4 w-4" /> Say
                  </div>
                  <ul className="mt-2 space-y-2 text-sm font-semibold leading-6 text-slate-500">
                    <li className="flex gap-2">
                      <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                      <span>{a.description}</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-500">
                    <Eye className="h-4 w-4" /> Watch for
                  </div>
                  <ul className="mt-2 space-y-2 text-sm font-semibold leading-6 text-slate-500">
                    {watchFors.map((watchFor) => (
                      <li key={watchFor} className="flex gap-2">
                        <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                        <span>{watchFor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-500">
                    <CheckCircle2 className="h-4 w-4" /> Move on when
                  </div>
                  <ul className="mt-2 space-y-2 text-sm font-semibold leading-6 text-slate-500">
                    <li className="flex gap-2">
                      <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                      <span>{a.deliverable}</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : null}

            {facilitatorMode ? (
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-black text-slate-950">Participants</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{a.participants}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-black text-slate-950">Materials</div>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                    {a.materials.map((m) => (
                      <li key={m}>• {m}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-black text-slate-950">Deliverable</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{a.deliverable}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-black text-slate-950">Facilitator tips</div>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                    {a.tips.map((tip) => (
                      <li key={tip}>💡 {tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-wide text-slate-500">Expected output</div>
                <p className="mt-2 text-base font-semibold leading-7 text-slate-800">{a.deliverable}</p>

                {a.tips.length > 0 ? (
                  <div className="mt-4 border-t pt-4">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-500">What to keep in mind</div>
                    <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600 md:grid-cols-2">
                      {a.tips.slice(0, 4).map((tip) => (
                        <li key={tip} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            {facilitatorMode ? (
              <div className="mt-6 rounded-xl border bg-slate-50 p-3">
                <label htmlFor={`${key}-notes`} className="text-sm font-black">
                  Activity notes
                </label>
                <textarea
                  id={`${key}-notes`}
                  value={notes}
                  onChange={(e) => dispatch({ type: "notes/set", key, value: e.target.value })}
                  className="mt-2 min-h-24 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950"
                  placeholder="Capture outputs, decisions, observations, and evidence..."
                />
              </div>
            ) : null}

            {facilitatorMode ? <ArtefactCapture activityKeyValue={key} artefacts={artefacts} dispatch={dispatch} /> : null}

            {facilitatorMode ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border p-3">
                <BookOpen className="h-4 w-4 text-slate-600" />
                <div className="min-w-0 flex-1">
                  <strong className="text-sm">{a.guideTitle}</strong>
                  <p className="truncate text-xs text-slate-500">{a.guideSubtitle}</p>
                </div>

                {a.id === "hmw" ? (
                  <Button variant="secondary" onClick={openHmw}>
                    Open Tool
                  </Button>
                ) : null}

                {guide ? (
                  <Button variant="secondary" onClick={() => setSelectedGuide(guide)}>
                    <BookOpen className="h-4 w-4" /> Open guide
                  </Button>
                ) : null}
              </div>
            ) : null}
          </Panel>
        );
      })}

      <GuideDrawer guide={selectedGuide} onClose={() => setSelectedGuide(null)} />
      </div>
    </>
  );
}

// Helper functions and components for artefact grouping and cards

async function loadLatestLiveCloudSession() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("sprint_sessions")
    .select("id,name,status,state,created_at,updated_at")
    .eq("status", "live")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Unable to load latest live sprint session", error);
    return null;
  }

  return data ? cloudRowToSprintSession(data as unknown as CloudSprintSessionRow) : null;
}

function getNoteGroupDescription(noteKind: Artefact["noteKind"]) {
  switch (noteKind) {
    case "insight":
      return "What the team has learned or noticed.";
    case "opportunity":
      return "Possible areas to explore, improve, or prototype.";
    case "parking":
      return "Useful but off-track items to revisit later.";
    case "decision":
      return "Choices made during the sprint.";
    case "risk":
      return "Concerns, blockers, assumptions, or things to validate.";
    case "question":
      return "Open questions the team still needs to answer.";
    case "recommendation":
      return "Suggested next steps or actions based on sprint evidence.";
    default:
      return "Captured sprint note artefacts.";
  }
}

function ArtefactGroup({
  title,
  description,
  icon: Icon,
  badgeClassName,
  count,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  badgeClassName: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-slate-50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-wrap items-center justify-between gap-3 p-3 text-left transition hover:bg-slate-100"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white", badgeClassName)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="truncate text-sm font-black">{title}</h4>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-slate-600 shadow-sm">{count}</span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-slate-500">
          {expanded ? "Collapse" : "Expand"}
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>
      {expanded ? <div className="border-t bg-white p-3">{children}</div> : null}
    </section>
  );
}

function getParticipantWaitingMessage(state: AppState) {
  const currentDay = sprintDays.find((day) => day.id === state.currentDay) ?? sprintDays[0];
  const daySchedule = state.scheduleOverrides[currentDay.id] ?? currentDay.schedule;
  const completed = new Set(state.completed);

  const nextScheduleItem = daySchedule.find((item) => {
    if (item.isBreak) return false;
    const resolved = getActivityForScheduleItem(currentDay, item);
    if (!resolved) return false;
    return !completed.has(activityKey(resolved.day.id, resolved.activity.id));
  });

  const nextActivity = nextScheduleItem ? getActivityForScheduleItem(currentDay, nextScheduleItem) : null;
  const nextTitle = nextActivity?.activity.title ?? nextScheduleItem?.title;

  if (!nextTitle) {
    return {
      eyebrow: "DAY COMPLETE",
      title: `Great work — ${currentDay.label} is wrapped up 🎉`,
      body: "Your facilitator will guide the next step when the team is ready.",
    };
  }

  return {
    eyebrow: "WAITING",
    title: "Your friendly facilitator will start the activity shortly 🤓",
    body: `Next up: ${nextTitle}. Keep this screen visible for the sprint flow.`,
  };
}

function InlineFormattedText({ text }: { text: string }) {
  const cleanedText = text
    .replace(/^>\s*/gm, "")
    .replace(/\n/g, " ")
    .trim();

  const parts = cleanedText.split(/(\*\*.*?\*\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        const isBold = part.startsWith("**") && part.endsWith("**");

        if (isBold) {
          return (
            <strong key={index} className="font-semibold text-slate-950">
              {part.slice(2, -2)}
            </strong>
          );
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

function FormattedArtefactText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }

        if (trimmed.startsWith("##")) {
          return (
            <h5 key={index} className="pt-1 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              <InlineFormattedText text={trimmed.replace(/^##\s*/, "")} />
            </h5>
          );
        }

        if (trimmed.startsWith("#")) {
          return (
            <h4 key={index} className="pt-2 text-base font-black text-slate-900">
              <InlineFormattedText text={trimmed.replace(/^#\s*/, "")} />
            </h4>
          );
        }

        if (trimmed.startsWith("-")) {
          return (
            <div
              key={index}
              className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-slate-700"
            >
              <span className="mt-[0.45rem] text-xs text-purple-500">●</span>
        
              <div className="min-w-0 flex-1 leading-8 text-slate-700">
                <InlineFormattedText text={trimmed.replace(/^\-\s*/, "")} />
              </div>
            </div>
          );
        }

        if (trimmed.startsWith(">")) {
          return (
            <blockquote key={index} className="border-l-4 border-purple-200 pl-4 italic text-slate-500">
              <InlineFormattedText text={trimmed.replace(/^>\s*/, "")} />
            </blockquote>
          );
        }

        return (
          <p key={index}>
            <InlineFormattedText text={line} />
          </p>
        );
      })}
    </div>
  );
}

function SessionRecommendationText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }

        if (trimmed.startsWith("##")) {
          return (
            <h5 key={index} className="pt-1 text-xs font-black uppercase tracking-[0.2em] text-purple-700">
              <InlineFormattedText text={trimmed.replace(/^##\s*/, "")} />
            </h5>
          );
        }

        if (trimmed.startsWith("#")) {
          return (
            <h4 key={index} className="pt-2 text-base font-black text-slate-900">
              <InlineFormattedText text={trimmed.replace(/^#\s*/, "")} />
            </h4>
          );
        }

        if (trimmed.startsWith("-")) {
          return (
            <p key={index} className="flex gap-2 leading-7 text-slate-700">
              <span className="text-purple-500">•</span>
              <span>
                <InlineFormattedText text={trimmed.replace(/^\-\s*/, "")} />
              </span>
            </p>
          );
        }

        if (trimmed.startsWith(">")) {
          return (
            <blockquote key={index} className="border-l-4 border-purple-200 pl-4 italic text-slate-500">
              <InlineFormattedText text={trimmed.replace(/^>\s*/, "")} />
            </blockquote>
          );
        }

        return (
          <p key={index}>
            <InlineFormattedText text={line} />
          </p>
        );
      })}
    </div>
  );
}

function CompactNoteArtefactPreview({ artefact, expanded }: { artefact: Artefact; expanded: boolean }) {
  const noteType = getNoteArtefactType(artefact.noteKind);
  const Icon = noteType.icon;

  return (
    <div className={cx("flex items-center gap-3 p-3 text-white bg-gradient-to-r", noteType.color)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">{noteType.label}</span>
        </div>
        <div className="mt-1 truncate text-sm font-black">{artefact.name || "Untitled note"}</div>
        <div className="mt-0.5 line-clamp-2 text-xs text-white/75 whitespace-pre-wrap">
          {artefact.caption || "Add note details."}
        </div>
      </div>
      {expanded ? <ChevronDown className="h-4 w-4 text-white/70" /> : <ChevronRight className="h-4 w-4 text-white/70" />}
    </div>
  );
}

function ArtefactCard({
  artefact,
  activityKeyValue,
  dispatch,
}: {
  artefact: Artefact;
  activityKeyValue: string;
  dispatch: React.Dispatch<Action>;
}) {
  const [expanded, setExpanded] = useState(false);
  const imageSrc = artefact.publicUrl ?? artefact.dataUrl;

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="block w-full text-left">
        {artefact.type === "photo" && imageSrc ? (
          <div className="flex items-center gap-3 p-3 hover:bg-slate-50">
            <img src={imageSrc} alt={artefact.caption || artefact.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black">{artefact.name || "Untitled photo"}</div>
              <div className="mt-1 line-clamp-2 text-xs text-slate-500">{artefact.caption || "No caption yet."}</div>
            </div>
            {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </div>
        ) : (
          <CompactNoteArtefactPreview artefact={artefact} expanded={expanded} />
        )}
      </button>

      {expanded ? (
        <div className="space-y-2 border-t bg-slate-50 p-3">
          {artefact.type === "photo" && imageSrc ? (
            <img src={imageSrc} alt={artefact.caption || artefact.name} className="max-h-72 w-full rounded-xl object-cover" />
          ) : (
            <NoteArtefactPreview artefact={artefact} />
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-black">{artefact.name}</div>
              <div className="text-xs text-slate-500">Saved to {activityKeyValue}</div>
            </div>
            <Button
              variant="ghost"
              className="px-2 py-1"
              onClick={() => dispatch({ type: "artefact/remove", key: activityKeyValue, artefactId: artefact.id })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <input
            value={artefact.name}
            onChange={(event) =>
              dispatch({
                type: "artefact/updateName",
                key: activityKeyValue,
                artefactId: artefact.id,
                name: event.target.value,
              })
            }
            className="w-full rounded-lg border bg-white p-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-950"
            placeholder={artefact.type === "photo" ? "Photo title e.g. Problem map" : "Note title e.g. Key opportunity"}
          />

          {artefact.type === "note" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {noteArtefactTypes.map((type) => {
                const Icon = type.icon;
                const active = artefact.noteKind === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "artefact/updateNoteKind",
                        key: activityKeyValue,
                        artefactId: artefact.id,
                        noteKind: type.id,
                      })
                    }
                    className={cx(
                      "inline-flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs font-black transition",
                      active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" /> {type.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          {artefact.type === "note" ? (
            <div className="mb-2 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-2 py-1"># Heading</span>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-1">## Label</span>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-1">- Bullet</span>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-1">&gt; Quote</span>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-1">Blank line = spacing</span>
            </div>
          ) : null}

          <textarea
            value={artefact.caption}
            onChange={(event) =>
              dispatch({
                type: "artefact/updateCaption",
                key: activityKeyValue,
                artefactId: artefact.id,
                caption: event.target.value,
              })
            }
            className="min-h-20 w-full rounded-lg border bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-slate-950"
            placeholder={
              artefact.type === "photo"
                ? "Caption this photo e.g. Problem map wall"
                : "Capture evidence, insight, recommendation, or quotes. Use # for headings, ## for labels, - for bullets, > for quotes, and blank lines for spacing."
            }
          />

          {/* Expanded formatted preview */}
          {artefact.type === "note" && artefact.caption ? (
            <div className="rounded-xl border bg-white p-4">
              <FormattedArtefactText text={artefact.caption} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ArtefactCapture({
  activityKeyValue,
  artefacts,
  dispatch,
}: {
  activityKeyValue: string;
  artefacts: Artefact[];
  dispatch: React.Dispatch<Action>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;

      const path = `artefacts/${createClientId("artefact")}-${file.name}`;

      if (!supabase) {
        console.error("Supabase is not configured");
        return;
      }
      
      const { data, error } = await supabase.storage
        .from("sprint-artefacts")
        .upload(path, file);
      
      if (error) {
        console.error(error);
        return;
      }
      
      const publicUrl =
        supabase.storage
          .from("sprint-artefacts")
          .getPublicUrl(path).data.publicUrl;

      dispatch({
        type: "artefact/add",
        key: activityKeyValue,
        artefact: {
          id: `${activityKeyValue}-${Date.now()}-${file.name}`,
          activityKey: activityKeyValue,
          type: "photo",
          name: file.name,
          storagePath: path,
          publicUrl,
          caption: "",
          createdAt: Date.now(),
        },
      });
    }
  };

  const [noteMenuOpen, setNoteMenuOpen] = useState(false);

  const addQuickNote = (noteKind: Artefact["noteKind"]) => {
    const noteType = getNoteArtefactType(noteKind);

    dispatch({
      type: "artefact/add",
      key: activityKeyValue,
      artefact: {
        id: `${activityKeyValue}-${Date.now()}-note`,
        activityKey: activityKeyValue,
        type: "note",
        name: `Untitled ${noteType.label.toLowerCase()}`,
        caption: "",
        noteKind: noteType.id,
        createdAt: Date.now(),
      },
    });
    setNoteMenuOpen(false);
  };

  const photoArtefacts = artefacts.filter((artefact) => artefact.type === "photo");
  const noteArtefactGroups = noteArtefactTypes
    .map((type) => ({
      ...type,
      artefacts: artefacts.filter((artefact) => artefact.type === "note" && (artefact.noteKind ?? "insight") === type.id),
    }))
    .filter((group) => group.artefacts.length > 0);

  // Group expansion state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => ({ photos: true }));

  const isGroupExpanded = (groupId: string) => expandedGroups[groupId] ?? true;
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((current) => ({ ...current, [groupId]: !(current[groupId] ?? true) }));
  };

  return (
    <div className="mt-4 rounded-xl border bg-white p-3">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h3 className="text-sm font-black">Artefacts</h3>
          <p className="mt-1 text-xs text-slate-500">
            {artefacts.length
              ? `${artefacts.length} captured`
              : "Add photos, notes, decisions, risks, or evidence"}
          </p>
        </div>

        <ChevronDown
          className={cx(
            "h-4 w-4 text-slate-500 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black">Artefacts</h3>
              <p className="mt-1 text-xs text-slate-500">
                Capture sprint-wall photos, sketches, sticky notes, and room outputs for the report.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-slate-950 focus-within:ring-offset-2">
                <input type="file" accept="image/*" multiple className="sr-only" onChange={handleFiles} />
                <Download className="h-4 w-4" /> Upload photos
              </label>
              <div className="relative">
                <Button variant="secondary" onClick={() => setNoteMenuOpen((open) => !open)}>
                  <Plus className="h-4 w-4" /> Add note <ChevronDown className="h-4 w-4" />
                </Button>
                {noteMenuOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-500">
                      Choose note type
                    </div>
                    <div className="p-1">
                      {noteArtefactTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => addQuickNote(type.id)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <span className={cx("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white", type.color)}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span>{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {artefacts.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              No artefacts captured yet. Upload a photo of the wall, sketches, voting board, or add a quick note.
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {photoArtefacts.length > 0 ? (
                <ArtefactGroup
                  title="Photos"
                  description="Room photos, sprint wall captures, sketches, and physical artefacts."
                  icon={Download}
                  badgeClassName="bg-slate-100 text-slate-700"
                  count={photoArtefacts.length}
                  expanded={isGroupExpanded("photos")}
                  onToggle={() => toggleGroup("photos")}
                >
                  <div className="grid gap-2">
                    {photoArtefacts.map((artefact) => (
                      <ArtefactCard key={artefact.id} artefact={artefact} activityKeyValue={activityKeyValue} dispatch={dispatch} />
                    ))}
                  </div>
                </ArtefactGroup>
              ) : null}

              {noteArtefactGroups.map((group) => {
                const Icon = group.icon;
                return (
                  <ArtefactGroup
                    key={group.id}
                    title={group.label}
                    description={getNoteGroupDescription(group.id)}
                    icon={Icon}
                    badgeClassName={cx("text-white bg-gradient-to-r", group.color)}
                    count={group.artefacts.length}
                    expanded={isGroupExpanded(group.id)}
                    onToggle={() => toggleGroup(group.id)}
                  >
                    <div className="grid gap-2">
                      {group.artefacts.map((artefact) => (
                        <ArtefactCard key={artefact.id} artefact={artefact} activityKeyValue={activityKeyValue} dispatch={dispatch} />
                      ))}
                    </div>
                  </ArtefactGroup>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Guide({ day }: { day: SprintDay }) {
  if (day.id === "day2") {
    return (
      <GuidePanel
        title="Four-Step Sketch Process"
        items={[
          "Notes — review yesterday’s work",
          "Ideas — rough approaches",
          "Crazy 8s — eight variations in eight minutes",
          "Solution Sketch — detailed, self-explanatory concept",
        ]}
      />
    );
  }

  if (day.id === "day3") {
    return (
      <GuidePanel
        title="Prototyping Best Practices"
        items={[
          "Focus on the critical path",
          "Use realistic content",
          "Make it feel authentic",
          "Do not build the whole product",
          "Fake anything that does not need to work",
        ]}
      />
    );
  }

  if (day.id === "day4") {
    return (
      <GuidePanel
        title="Testing Guide"
        items={[
          "Recruit representative users",
          "Ask open-ended questions",
          "Observe behaviour over opinions",
          "Debrief after each session",
          "Look for repeated patterns",
        ]}
      />
    );
  }

  return (
    <DayResources
      day={day}
      openHmw={() => undefined}
    />
  );
}

function GuidePanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3 grid gap-4 md:grid-cols-2">
      <Panel className="p-5">
        <h2 className="font-black">{title}</h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
      <Panel className="p-5">
        <h2 className="font-black">Facilitator Tips</h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
          <li>Set clear expectations at the start.</li>
          <li>Time-box everything.</li>
          <li>Work silently where possible to reduce groupthink.</li>
          <li>Keep decisions visible.</li>
        </ul>
      </Panel>
    </div>
  );
}

function DayResources({ day, openHmw }: { day: SprintDay; openHmw: () => void }) {
  const cards = day.id === "day1" ? [["Problem Mapping Template", "Visual template for mapping user journeys and identifying pain points.", "Download Template"], ["Expert Interview Script", "Sample questions and structure for conducting expert interviews.", "Download Script"], ["How Might We Generator", "Interactive tool to help generate better How Might We questions.", "Open Tool"], ["Voting & Decision Framework", "Structured approach for making decisions and selecting targets.", "Download Framework"]] : [[`${day.label} Worksheet`, `Support template for ${day.title}.`, "Download Template"], [day.guideLabel, `Practical support for running ${day.label}.`, "View Guide"], ["Decision Log", "Capture key decisions and outputs.", "Open Log"], ["Facilitator Checklist", "Keep the session on track.", "View Checklist"]];
  return (
    <div className="mt-3 grid gap-4 md:grid-cols-2">
      {cards.map(([title, desc, action]) => (
        <Panel key={title} className="p-5">
          <h2 className="flex items-center gap-2 font-black">
            <BookOpen className="h-4 w-4" /> {title}
          </h2>
          <p className="mt-7 text-sm leading-6 text-slate-500">{desc}</p>
          <Button variant="secondary" className="mt-4 w-full" onClick={title.includes("How Might") ? openHmw : undefined}>
            {action}
          </Button>
        </Panel>
      ))}
    </div>
  );
}

function TimerPage({
  state,
  dispatch,
  onNavigate,
  facilitatorMode,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onNavigate: (page: Page) => void;
  facilitatorMode: boolean;
}) {
  const activeActivity = useMemo(() => {
    if (!state.runningActivityId) return null;

    for (const day of sprintDays) {
      const activity = day.activities.find((item) => activityKey(day.id, item.id) === state.runningActivityId);
      if (activity) return { day, activity };
    }

    return null;
  }, [state.runningActivityId]);

  const countdown = useActivityCountdown(state);
  const totalSeconds = state.runningActivityDurationSeconds ?? 0;
  const remainingPercent = totalSeconds > 0 ? Math.max(0, Math.min(100, (countdown.remainingSeconds / totalSeconds) * 100)) : 0;
  const timerDayColour = activeActivity?.day.colour ?? "green";
  const c = colour[timerDayColour];
  const timerTone = {
    blue: {
      page: "from-slate-950 via-blue-950 to-slate-950",
      card: "border-blue-300/20 bg-blue-400/10 shadow-blue-950/40",
      text: "text-blue-200",
      progress: "from-blue-300 to-blue-500",
      pill: "bg-blue-300 text-blue-950",
    },
    green: {
      page: "from-slate-950 via-emerald-950 to-slate-950",
      card: "border-emerald-300/20 bg-emerald-400/10 shadow-emerald-950/40",
      text: "text-emerald-200",
      progress: "from-emerald-300 to-emerald-500",
      pill: "bg-emerald-300 text-emerald-950",
    },
    orange: {
      page: "from-slate-950 via-orange-950 to-slate-950",
      card: "border-orange-300/20 bg-orange-400/10 shadow-orange-950/40",
      text: "text-orange-200",
      progress: "from-orange-300 to-orange-500",
      pill: "bg-orange-300 text-orange-950",
    },
    purple: {
      page: "from-slate-950 via-purple-950 to-slate-950",
      card: "border-purple-300/20 bg-purple-400/10 shadow-purple-950/40",
      text: "text-purple-200",
      progress: "from-purple-300 to-purple-500",
      pill: "bg-purple-300 text-purple-950",
    },
  }[timerDayColour];

  return (
    <main className={cx("min-h-[calc(100vh-68px)] bg-gradient-to-br px-6 py-8 text-white md:px-10 lg:px-16", timerTone.page)}>
      <div className="mx-auto max-w-[1280px]">
        <Button variant="secondary" onClick={() => onNavigate("dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <h1 className="mt-6 text-5xl font-black">Live activity timer</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Synced timer for facilitator and participant views.
        </p>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className={cx("rounded-[2.5rem] border p-10 text-center shadow-2xl backdrop-blur-xl", timerTone.card)}>
            {activeActivity ? (
              <>
                <div className="flex justify-center">
                  <span className={cx("rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide", countdown.isOvertime ? "bg-red-300 text-red-950" : timerTone.pill)}>
                    {activeActivity.day.label}: {activeActivity.activity.title}
                  </span>
                </div>

                <div
                  className={cx(
                    "mt-10 text-8xl font-black leading-none tracking-tight transition-all duration-500 md:text-9xl",
                    countdown.isOvertime ? "text-red-300" : timerTone.text,
                    activeActivity && !countdown.isOvertime && "drop-shadow-[0_0_18px_rgba(255,255,255,0.15)]",
                  )}
                >
                  {formatCountdown(countdown.remainingSeconds)}
                </div>

                <div className="mt-4 text-sm font-black uppercase tracking-[0.28em] text-white/60">
                  Time remaining
                </div>

                <div className="mt-10 h-5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cx(
                      "h-full rounded-full bg-gradient-to-r transition-[width] duration-500",
                      countdown.isOvertime ? "from-red-300 to-red-500" : timerTone.progress,
                    )}
                    style={{ width: `${countdown.isOvertime ? 100 : remainingPercent}%` }}
                  />
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Button variant="secondary" onClick={() => dispatch({ type: "activity/addTime", seconds: 5 * 60 })}>+5 min</Button>
                  <Button variant="secondary" onClick={() => dispatch({ type: "activity/addTime", seconds: 10 * 60 })}>+10 min</Button>
                  <Button variant="secondary" onClick={() => dispatch({ type: "activity/stop" })}>Stop</Button>
                </div>
              </>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center">
                <Clock className="h-16 w-16 text-white/30" />
                <h2 className="mt-6 text-3xl font-black">No activity is running</h2>
                <p className="mt-3 max-w-xl text-slate-300">
                  Open a day and choose Run Activity. The timer will start from that activity’s duration.
                </p>
              </div>
            )}
          </div>

          <aside className="rounded-[2.5rem] bg-white p-8 text-slate-950 shadow-2xl">
            <h2 className="text-2xl font-black">Timer controls</h2>
            <p className="mt-2 text-sm text-slate-600">
              Use the activity controls to extend, pause, or stop the currently running timer.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <span className="font-bold text-slate-600">Elapsed</span>
                <span className="font-black">{formatCountdown(countdown.elapsedSeconds)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <span className="font-bold text-slate-600">Current timebox</span>
                <span className="font-black">{totalSeconds ? formatCountdown(totalSeconds) : "--:--"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <span className="font-bold text-slate-600">Mode</span>
                <span className="font-black">{facilitatorMode ? "Facilitator" : "Participant"}</span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function ResourcesPage({ setPage }: { setPage: (page: Page) => void }) {
  const [tab, setTab] = useState<ResourceTab>("facilitation");
  const totalGuides = resourceCategories.reduce((count, category) => count + category.guides.length, 0);
  const [selectedGuide, setSelectedGuide] = useState<ResourceGuide | null>(null);

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8">
      <Button variant="secondary" onClick={() => setPage("dashboard")}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h1 className="text-3xl font-black">Resource Library</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            A facilitator operating system for running a design sprint, not just a collection of templates. Start with the playbook, then use the guides, scripts, and troubleshooting resources when you need them.
          </p>
        </div>
        <Panel className="p-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-black">{totalGuides}</div>
              <div className="text-xs font-bold text-slate-500">Guides</div>
            </div>
            <div>
              <div className="text-2xl font-black">6</div>
              <div className="text-xs font-bold text-slate-500">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-black">4</div>
              <div className="text-xs font-bold text-slate-500">Sprint days</div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        <button onClick={() => setTab("facilitation")} className={cx("rounded-xl py-2 text-sm font-black", tab === "facilitation" && "bg-white shadow-sm")}>
          Guides & Playbooks
        </button>
        <button onClick={() => setTab("templates")} className={cx("rounded-xl py-2 text-sm font-black", tab === "templates" && "bg-white shadow-sm")}>
          Templates & Tools
        </button>
      </div>

      {tab === "facilitation" ? <ResourceGuideLibrary onOpenGuide={setSelectedGuide} /> : <ResourceTemplateLibrary />}
      <GuideDrawer guide={selectedGuide} onClose={() => setSelectedGuide(null)} />
    </main>
  );
}

function ResourceGuideLibrary({ onOpenGuide }: { onOpenGuide: (guide: ResourceGuide) => void }) {
  return (
    <div className="mt-4 space-y-5">
      <DarkPanel className="border-0 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">Recommended starting point</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/70">
              If someone is new to design sprints, start with the Sprint Facilitation Playbook, Setup & Logistics, and Day Opening & Closing Scripts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">1. Setup</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">2. Playbook</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">3. Scripts</span>
          </div>
        </div>
      </DarkPanel>

      {resourceCategories.map((category) => (
        <ResourceCategorySection key={category.title} category={category} onOpenGuide={onOpenGuide} />
      ))}
    </div>
  );
}

function ResourceCategorySection({
  category,
  onOpenGuide,
}: {
  category: { title: string; description: string; guides: ResourceGuide[] };
  onOpenGuide: (guide: ResourceGuide) => void;
}) {
  const [expanded, setExpanded] = useState(category.title === "Foundations" || category.title === "Run the Sprint");

  return (
    <Panel className="overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black">{category.title}</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600">{category.guides.length}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{category.description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-slate-500">
          {expanded ? "Collapse" : "Expand"}
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>
      {expanded ? (
        <div className="grid gap-4 border-t bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-3">
          {category.guides.map((guide) => (
            <ResourceGuideCard key={guide.title} guide={guide} onOpen={() => onOpenGuide(guide)} />
          ))}
        </div>
      ) : null}
    </Panel>
  );
}

function ResourceGuideCard({ guide, onOpen }: { guide: ResourceGuide; onOpen: () => void }) {
  const Icon = guide.icon;
  return (
    <article className="flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
          {guide.kind}
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <h3 className="mt-4 text-base font-black">{guide.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{guide.description}</p>

        <div className="mt-4 grid gap-2 text-xs text-slate-500">
          <div className="flex items-center justify-between gap-3">
            <span className="font-black text-slate-700">Stage</span>
            <span>{guide.stage}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-black text-slate-700">Audience</span>
            <span className="text-right">{guide.audience}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-black text-slate-700">Use</span>
            <span>{guide.time}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <Button variant="secondary" className="w-full" onClick={onOpen}>
          <BookOpen className="h-4 w-4" /> Open guide
        </Button>
      </div>
    </article>
  );
}

function GuideDrawer({ guide, onClose }: { guide: ResourceGuide | null; onClose: () => void }) {
  if (!guide) return null;

  const Icon = guide.icon;
  const content = getGuideContent(guide);
  const [mode, setMode] = useState<"read" | "facilitate">("read");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={guide.title}>
      <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black">{guide.title}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">{guide.kind}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{content.summary}</p>

                <div className="mt-3 inline-grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("read")}
                    className={cx("rounded-lg px-3 py-1.5 text-xs font-black", mode === "read" && "bg-white shadow-sm")}
                  >
                    Read mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("facilitate")}
                    className={cx("rounded-lg px-3 py-1.5 text-xs font-black", mode === "facilitate" && "bg-white shadow-sm")}
                  >
                    Facilitate mode
                  </button>
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" /> Close
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {mode === "read" ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <GuideMiniPanel label="Stage" value={guide.stage} />
                <GuideMiniPanel label="Audience" value={guide.audience} />
                <GuideMiniPanel label="Use" value={guide.time} />
              </div>

              <GuideSection title="Use this when" items={content.useWhen} />

              <section className="mt-5 rounded-2xl border bg-slate-50 p-4">
                <h3 className="font-black">Facilitation pattern</h3>
                <div className="mt-4 space-y-3">
                  {content.steps.map((step, index) => (
                    <div key={step.title} className="rounded-xl border bg-white p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-black">{step.title}</h4>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{step.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <GuideSection title="Facilitator prompts" items={content.facilitatorPrompts} />
                <GuideSection title="Checklist" items={content.checklist} />
                <GuideSection title="Watchouts" items={content.watchouts} tone="warning" />
                <GuideSection title="Outputs to capture" items={content.outputs} />
              </div>
            </>
          ) : (
            <GuideFacilitateMode content={content} />
          )}
        </div>
      </div>
    </div>
  );
}

function GuideFacilitateMode({ content }: { content: GuideContent }) {
  return (
    <div className="mt-5 flex flex-1 flex-col space-y-4">
      <section className="rounded-2xl border bg-slate-950 p-5 text-white">
        <h3 className="text-lg font-black">Facilitator script</h3>
        <p className="mt-1 text-sm text-white/60">Use these prompts live in the room.</p>
        <div className="mt-4 space-y-3">
          {content.facilitatorPrompts.map((prompt) => (
            <div
              key={prompt}
              className="rounded-xl border border-white/10 bg-white/10 p-4 text-base leading-7 text-white/90"
            >
              “{prompt}”
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h3 className="text-lg font-black">Run this pattern</h3>
        <div className="mt-4 space-y-3">
          {content.steps.map((step, index) => (
            <details key={step.title} className="rounded-xl border bg-slate-50 p-4" open={index === 0}>
              <summary className="cursor-pointer font-black">
                {index + 1}. {step.title}
              </summary>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.detail}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-emerald-50 p-5">
        <h3 className="text-lg font-black">Before you move on</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          {content.checklist.map((item) => (
            <li key={item} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function GuideMiniPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function GuideSection({ title, items, tone = "default" }: { title: string; items: string[]; tone?: "default" | "warning" }) {
  return (
    <section className={cx("mt-5 rounded-2xl border p-4", tone === "warning" ? "border-amber-200 bg-amber-50" : "bg-white")}>
      <h3 className="font-black">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className={cx("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", tone === "warning" ? "bg-amber-500" : "bg-slate-950")} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResourceTemplateLibrary() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resourceTemplateCards.map((template) => (
          <Panel key={template} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black">{template}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Reusable worksheet or canvas to support live sprint activities.</p>
              </div>
              <Download className="h-5 w-5 text-slate-400" />
            </div>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => setSelectedTemplate(template)}>
              <Eye className="h-4 w-4" /> Preview template
            </Button>
          </Panel>
        ))}
      </div>

      <TemplatePreviewDrawer template={selectedTemplate} onClose={() => setSelectedTemplate(null)} />
    </>
  );
}

function TemplatePreviewDrawer({ template, onClose }: { template: string | null; onClose: () => void }) {
  if (!template) return null;

  const lower = template.toLowerCase();
  const preview = lower.includes("problem") || lower.includes("map")
    ? {
        title: template,
        subtitle: "Map the end-to-end journey, surface pain points, and identify the highest-value area to focus the sprint.",
        sections: ["Actors / users", "Journey stages", "Pain points", "Questions", "Opportunities"],
        sample: ["User starts with…", "They get stuck when…", "The biggest risk is…", "How might we…"],
      }
    : lower.includes("interview")
    ? {
        title: template,
        subtitle: "A structured interview guide for collecting expert insight without losing the sprint team in open-ended discussion.",
        sections: ["Expert role", "What they know", "Key constraints", "Risks", "Recommended direction"],
        sample: ["What should we understand first?", "Where do users struggle most?", "What has been tried before?", "What could block progress?"],
      }
    : lower.includes("hmw") || lower.includes("might")
    ? {
        title: template,
        subtitle: "Turn problems, insights, and friction points into useful How Might We prompts for ideation.",
        sections: ["Insight", "Problem", "HMW question", "Theme", "Priority"],
        sample: ["How might we help…", "How might we reduce…", "How might we make it easier to…", "How might we support…"],
      }
    : lower.includes("voting") || lower.includes("decision")
    ? {
        title: template,
        subtitle: "A decision canvas for narrowing options quickly and making the Decider’s choice visible.",
        sections: ["Option", "Evidence", "Impact", "Effort", "Decision"],
        sample: ["Strong signal from users", "Low confidence", "High impact", "Needs Decider input"],
      }
    : lower.includes("checklist")
    ? {
        title: template,
        subtitle: "A lightweight facilitator checklist to keep the session moving and make sure outputs are captured.",
        sections: ["Before session", "During activity", "Before moving on", "After session"],
        sample: ["Timer visible", "Output clear", "Decisions captured", "Next step agreed"],
      }
    : {
        title: template,
        subtitle: "A reusable sprint template for capturing decisions, evidence, outputs, and next steps.",
        sections: ["Context", "Input", "Activity output", "Decision", "Next step"],
        sample: ["What we know", "What we need to test", "What we decided", "What happens next"],
      };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={preview.title}>
      <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                <Eye className="h-3.5 w-3.5" /> Template preview
              </div>
              <h2 className="mt-3 text-2xl font-black">{preview.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{preview.subtitle}</p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" /> Close
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="font-black">Template structure</h3>
              <div className="mt-4 space-y-3">
                {preview.sections.map((section, index) => (
                  <div key={section} className="flex items-center gap-3 rounded-xl border bg-white p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">{index + 1}</span>
                    <span className="text-sm font-black text-slate-800">{section}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-5">
              <h3 className="font-black">Example prompts</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {preview.sample.map((item) => (
                  <li key={item} className="flex gap-2 rounded-xl bg-slate-50 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-5 rounded-2xl border bg-slate-950 p-5 text-white">
            <h3 className="font-black">How this would be used live</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              This preview shows the shape of the template and the prompts a facilitator would use in the room. A later export/download step can turn this into a printable worksheet, canvas, or shareable board template.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function HmwModal({
  open,
  onClose,
  state,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  state: AppState;
  dispatch: React.Dispatch<Action>;
}) {
  const [tab, setTab] = useState<HmwTab>("generate");
  const [problem, setProblem] = useState("users struggle to find relevant information quickly on our website");
  const [targetUser, setTargetUser] = useState("busy parents");
  const [context, setContext] = useState("during onboarding, time constraints");
  if (!open) return null;
  const generate = () => {
    const qs = [
      `How might we help ${targetUser} achieve their goals despite ${problem}?`,
      `How might we empower ${targetUser} to feel more confident when navigating this process?`,
      `How might we reduce the frustration ${targetUser} feel when ${problem}?`,
      `How might we make ${targetUser} feel more supported throughout ${context}?`,
    ];
    dispatch({ type: "hmw/addMany", questions: qs, writeToDay1HmwNotes: true });
    setTab("saved");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black">
              <HelpCircle className="h-5 w-5" /> How Might We Generator
            </h2>
            <p className="text-sm text-slate-500">Interactive tool to help generate better How Might We questions.</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" /> Close
          </Button>
        </div>

        <div className="mx-5 mt-4 grid grid-cols-4 rounded-2xl bg-slate-100 p-1">
          {(["generate", "saved", "templates", "guide"] as HmwTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cx("rounded-xl py-2 text-sm font-black capitalize", tab === t && "bg-white shadow-sm")}>
              {t}
            </button>
          ))}
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5">
          {tab === "generate" ? (
            <Panel className="p-5">
              <h3 className="text-lg font-black">Problem Definition</h3>

              <label className="mt-6 block text-sm font-black">Problem or Challenge *</label>
              <input
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                className="mt-2 w-full rounded-lg bg-slate-100 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950"
              />

              <label className="mt-4 block text-sm font-black">Target User</label>
              <input
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                className="mt-2 w-full rounded-lg bg-slate-100 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950"
              />

              <label className="mt-4 block text-sm font-black">Context</label>
              <input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="mt-2 w-full rounded-lg bg-slate-100 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950"
              />

              <Button className="mt-4 w-full" onClick={generate}>
                <Lightbulb className="h-4 w-4" /> Generate HMW Questions
              </Button>
            </Panel>
          ) : null}

          {tab === "saved" ? (
            <Panel className="p-8 text-center">
              {state.hmws.length === 0 ? (
                <>
                  <CheckCircle2 className="mx-auto h-14 w-14 text-slate-400" />
                  <h3 className="mt-4 font-black">No Saved Questions Yet</h3>
                  <p className="mt-2 text-sm text-slate-500">Generate HMW questions and save your favourites.</p>
                </>
              ) : (
                <div className="space-y-2 text-left">
                {state.hmws.map((q) => (
                  <div
                    key={q}
                    className="flex items-start gap-3 rounded-lg bg-slate-100 p-3 text-sm"
                  >
                    <span className="flex-1 leading-6">{q}</span>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        dispatch({ type: "hmw/delete", question: q });
                      }}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete HMW question"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                      aria-label="Copy HMW question"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                </div>
              )}
            </Panel>
          ) : null}

          {tab === "templates" ? (
            <GuidePanel
              title="HMW Templates"
              items={[
                "How might we help [users] achieve their goals despite [challenge]?",
                "How might we empower [users] to feel more confident?",
                "How might we reduce frustration when [problem] occurs?",
                "How might we make [process] feel more supportive?",
              ]}
            />
          ) : null}

          {tab === "guide" ? (
            <GuidePanel
              title="HMW Question Quality Framework"
              items={["User-centred", "Actionable", "Broad enough to inspire options", "Specific enough to focus the team", "Positive framing", "Solution-neutral"]}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}


// --- Synthesised report helpers ---
function summariseSprintThemes(artefacts: Record<string, Artefact[]>) {
  const allNotes = Object.values(artefacts)
    .flat()
    .filter((artefact) => artefact.type === "note");

  const grouped = noteArtefactTypes.map((type) => ({
    type,
    artefacts: allNotes.filter((artefact) => (artefact.noteKind ?? "insight") === type.id),
  }));

  return grouped.filter((group) => group.artefacts.length > 0);
}


function extractTopRecommendations(artefacts: Record<string, Artefact[]>) {
  return Object.values(artefacts)
    .flat()
    .filter(
      (artefact) =>
        artefact.type === "note" &&
        (artefact.noteKind ?? "insight") === "recommendation",
    )
    .slice(0, 6)
    .map((artefact) => ({
      id: artefact.id,
      name: artefact.name,
      caption: artefact.caption || "No additional context added.",
    }));
}

function synthesiseTestingRecommendations(testingSessions: Record<string, TestingSession>) {
  const recommendationTexts = Object.values(testingSessions)
    .map((session) => session.recommendation?.trim())
    .filter(
      (recommendation): recommendation is string =>
        Boolean(recommendation && recommendation.length > 0),
    );

  if (recommendationTexts.length === 0) {
    return [];
  }

  const groupedRecommendations: Array<{
    id: string;
    name: string;
    caption: string;
  }> = [];

  const themes = [
    {
      id: "search-flexibility",
      terms: ["search", "find", "postcode", "partial", "dob", "eligibility", "locality"],
      name: "Improve flexibility within the support journey",
      caption:
        "Testing participants highlighted the need for users to continue progressing even when information is incomplete, uncertain, or varies between local contexts.",
    },
    {
      id: "clarity-language",
      terms: ["language", "wording", "clarity", "understand", "tone", "content"],
      name: "Refine language and guidance",
      caption:
        "Several recommendations focused on making the experience easier to understand through clearer wording, guidance, and signposting.",
    },
    {
      id: "trust-confidence",
      terms: ["trust", "confidence", "transparent", "why", "logic", "system"],
      name: "Increase transparency and reassurance",
      caption:
        "Participants wanted greater visibility into how decisions or recommendations were being made so the experience felt more trustworthy and supportive.",
    },
    {
      id: "prioritisation",
      terms: ["priority", "prioritise", "overwhelming", "too much", "recommendation"],
      name: "Prioritise information more clearly",
      caption:
        "Testing suggested users may benefit from clearer prioritisation so important actions stand out from optional or secondary guidance.",
    },
    {
      id: "data-consent",
      terms: ["data", "privacy", "consent", "stored", "retained"],
      name: "Clarify data and consent expectations",
      caption:
        "Some recommendations highlighted the importance of making data handling, consent, and information storage more explicit to users.",
    },
  ];

  themes.forEach((theme) => {
    const matchedRecommendations = recommendationTexts.filter((recommendation) => {
      const lower = recommendation.toLowerCase();
      return theme.terms.some((term) => lower.includes(term));
    });

    if (matchedRecommendations.length > 0) {
      groupedRecommendations.push({
        id: theme.id,
        name: theme.name,
        caption: theme.caption,
      });
    }
  });

  const unmatchedRecommendations = recommendationTexts.filter((recommendation) => {
    const lower = recommendation.toLowerCase();

    return !themes.some((theme) =>
      theme.terms.some((term) => lower.includes(term)),
    );
  });

  unmatchedRecommendations.slice(0, 2).forEach((recommendation, index) => {
    groupedRecommendations.push({
      id: `direct-${index}`,
      name:
        recommendation.length > 90
          ? `${recommendation.slice(0, 87)}...`
          : recommendation,
      caption: "Direct recommendation captured during user testing.",
    });
  });

  return groupedRecommendations.slice(0, 5);
}

function buildSprintJourney(state: AppState) {
  return sprintDays.map((day) => {
    const completedActivities = day.activities.filter((activity) =>
      state.completed.includes(activityKey(day.id, activity.id)),
    );

    const artefacts = Object.entries(state.artefacts)
      .filter(([key]) => key.startsWith(`${day.id}-`))
      .flatMap(([, artefacts]) => artefacts);

    const topThemes = noteArtefactTypes
      .map((type) => ({
        type,
        count: artefacts.filter(
          (artefact) =>
            artefact.type === "note" &&
            (artefact.noteKind ?? "insight") === type.id,
        ).length,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      day,
      completedActivities,
      artefacts,
      topThemes,
    };
  });
}

function buildExecutiveSummary(state: AppState) {
  const allArtefacts = Object.values(state.artefacts).flat();
  const notes = allArtefacts.filter((artefact) => artefact.type === "note");

  const byKind = (kind: Artefact["noteKind"]) =>
    notes.filter((artefact) => (artefact.noteKind ?? "insight") === kind);

  const decisions = byKind("decision");
  const recommendations = byKind("recommendation");
  const risks = byKind("risk");
  const insights = byKind("insight");
  const opportunities = byKind("opportunity");
  const questions = byKind("question");

  const daySummaries = sprintDays.map((day) => {
    const completedActivities = day.activities.filter((activity) =>
      state.completed.includes(activityKey(day.id, activity.id)),
    );

    const dayArtefacts = Object.entries(state.artefacts)
      .filter(([key]) => key.startsWith(`${day.id}-`))
      .flatMap(([, artefacts]) => artefacts);

    const dayNotes = dayArtefacts.filter((artefact) => artefact.type === "note");
    const topNote = dayNotes.find((artefact) => artefact.caption?.trim() || artefact.name?.trim());

    return {
      day,
      completedActivities,
      artefactCount: dayArtefacts.length,
      noteCount: dayNotes.length,
      topNote,
    };
  });

  const strongestFinding = insights[0] ?? opportunities[0] ?? questions[0] ?? null;
  const strongestDecision = decisions[0] ?? null;
  const strongestRecommendation = recommendations[0] ?? null;

  return {
    decisions: decisions.length,
    recommendations: recommendations.length,
    risks: risks.length,
    insights: insights.length,
    opportunities: opportunities.length,
    questions: questions.length,
    daySummaries,
    strongestFinding,
    strongestDecision,
    strongestRecommendation,
    narrative: `This design sprint explored ${state.challenge || "the defined challenge"} for ${
      state.targetUsers || "the target users"
    }. Across the sprint, the team completed ${
      state.completed.length
    } activities and captured ${allArtefacts.length} evidence items. ${
      strongestFinding
        ? `The clearest emerging signal was: ${strongestFinding.name}${
            strongestFinding.caption ? ` — ${strongestFinding.caption}` : ""
          }.`
        : "The summary will become more specific as insights, decisions, risks, and recommendations are captured."
    } ${
      strongestRecommendation
        ? `The strongest next-step recommendation captured was: ${strongestRecommendation.name}${
            strongestRecommendation.caption ? ` — ${strongestRecommendation.caption}` : ""
          }.`
        : ""
    }`,
  };
}

function ReportArtefactsSection({
  groups,
}: {
  groups: Array<{ key: string; artefacts: Artefact[]; context: { day: SprintDay; activity: Activity } | null }>;
}) {
  const totalArtefacts = groups.reduce((sum, group) => sum + group.artefacts.length, 0);
  const [openArtefactDays, setOpenArtefactDays] = useState<Partial<Record<DayId | "unknown", boolean>>>({});

  const dayGroups = sprintDays
    .map((day) => {
      const activityGroups = groups.filter((group) => group.context?.day.id === day.id);
      const artefactCount = activityGroups.reduce((sum, group) => sum + group.artefacts.length, 0);

      return {
        key: day.id,
        title: day.label,
        subtitle: day.title,
        activityGroups,
        artefactCount,
      };
    })
    .filter((group) => group.artefactCount > 0);

  const unknownGroups = groups.filter((group) => !group.context);
  const unknownArtefactCount = unknownGroups.reduce((sum, group) => sum + group.artefacts.length, 0);

  const groupedDays: Array<{
    key: DayId | "unknown";
    title: string;
    subtitle: string;
    activityGroups: Array<{ key: string; artefacts: Artefact[]; context: { day: SprintDay; activity: Activity } | null }>;
    artefactCount: number;
  }> = [
    ...dayGroups,
    ...(unknownArtefactCount > 0
      ? [
          {
            key: "unknown" as const,
            title: "Unassigned evidence",
            subtitle: "Captured sprint evidence not linked to a specific day",
            activityGroups: unknownGroups,
            artefactCount: unknownArtefactCount,
          },
        ]
      : []),
  ];

  return (
    <Panel className="mt-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black">Sprint Evidence & Artefacts</h2>
          <p className="mt-1 text-sm text-slate-500">Photos and themed notes grouped by the activity that created them.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{totalArtefacts} captured</span>
      </div>

      {groupedDays.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed bg-slate-50 p-5 text-sm text-slate-500">No artefacts captured yet.</div>
      ) : (
        <div className="mt-5 space-y-5">
          {groupedDays.map((dayGroup) => {
            const isOpen = Boolean(openArtefactDays[dayGroup.key]);

            return (
              <section key={dayGroup.key} className="rounded-3xl border bg-slate-50 p-4">
                <button
                  type="button"
                  onClick={() =>
                    setOpenArtefactDays((current) => ({
                      ...current,
                      [dayGroup.key]: !current[dayGroup.key],
                    }))
                  }
                  className="flex w-full flex-wrap items-center gap-3 text-left"
                >
                  <div>
                    <h3 className="font-black">{dayGroup.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{dayGroup.subtitle}</p>
                  </div>

                  <span className="ml-auto rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
                    {dayGroup.artefactCount} captured
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {isOpen ? "Collapse" : "Expand"}
                  </span>
                </button>

                {isOpen ? (
                  <div className="mt-5 space-y-5">
                    {dayGroup.activityGroups.map((activityGroup) => {
                      const photoArtefacts = activityGroup.artefacts.filter((artefact) => artefact.type === "photo");
                      const noteGroups = noteArtefactTypes
                        .map((type) => ({
                          ...type,
                          artefacts: activityGroup.artefacts.filter(
                            (artefact) => artefact.type === "note" && (artefact.noteKind ?? "insight") === type.id,
                          ),
                        }))
                        .filter((type) => type.artefacts.length > 0);

                      return (
                        <section key={activityGroup.key} className="rounded-2xl border bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="font-black">
                                {activityGroup.context
                                  ? `${activityGroup.context.day.label}: ${activityGroup.context.activity.title}`
                                  : activityGroup.key}
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                {activityGroup.context?.activity.deliverable ?? "Captured sprint evidence"}
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
                              {activityGroup.artefacts.length}
                            </span>
                          </div>

                          {photoArtefacts.length > 0 ? (
                            <div className="mt-4">
                              <h4 className="text-sm font-black">Photos</h4>
                              <div className="mt-2 grid gap-3 md:grid-cols-2">
                                {photoArtefacts.map((artefact) => (
                                  <div key={artefact.id} className="overflow-hidden rounded-xl border bg-white">
                                    {artefact.dataUrl ? (
                                      <img
                                        src={artefact.publicUrl ?? artefact.dataUrl}
                                        alt={artefact.caption || artefact.name}
                                        className="h-40 w-full object-cover"
                                      />
                                    ) : null}
                                    <div className="p-3">
                                      <div className="text-sm font-black">{artefact.name}</div>
                                      <p className="mt-1 text-sm text-slate-500">{artefact.caption || "No caption added."}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {noteGroups.length > 0 ? (
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              {noteGroups.map((groupType) => {
                                const Icon = groupType.icon;
                                return (
                                  <div key={groupType.id} className="rounded-xl border bg-white p-3">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={cx(
                                          "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                                          groupType.color,
                                        )}
                                      >
                                        <Icon className="h-4 w-4" />
                                      </span>
                                      <h4 className="font-black">{groupType.label}</h4>
                                      <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600">
                                        {groupType.artefacts.length}
                                      </span>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                      {groupType.artefacts.map((artefact) => (
                                        <div key={artefact.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                                          <div className="font-black">{artefact.name}</div>
                                          <div className="mt-1 text-slate-600">{artefact.caption || "No details added."}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </section>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function PrintReport({ state }: { state: AppState }) {
  const sprintJourney = useMemo(() => buildSprintJourney(state), [state]);
  const executiveSummary = useMemo(() => buildExecutiveSummary(state), [state]);
  const recommendations = useMemo(() => {
    const testingRecommendations = synthesiseTestingRecommendations(state.testingSessions);
    return testingRecommendations.length > 0 ? testingRecommendations : extractTopRecommendations(state.artefacts);
  }, [state.artefacts, state.testingSessions]);

  const allArtefacts = useMemo(() => Object.values(state.artefacts).flat(), [state.artefacts]);
  const photoArtefacts = useMemo(
    () => allArtefacts.filter((artefact) => artefact.type === "photo"),
    [allArtefacts],
  );
  const noteArtefacts = useMemo(
    () => allArtefacts.filter((artefact) => artefact.type === "note"),
    [allArtefacts],
  );

  const testingSessions = Object.entries(state.testingSessions ?? {})
    .map(([key, session]) => {
      const activity = getDayAndActivityFromKey(key);
      const participantNumber = key.match(/testing-(\d+)/)?.[1];

      return {
        key,
        title: activity?.activity.title ?? "Testing Session",
        participant: session.participant?.trim() || `Participant ${participantNumber ?? ""}`.trim(),
        role: session.role ?? "",
        clarity: session.clarityScore ?? 0,
        usefulness: session.usefulnessScore ?? 0,
        confidence: session.confidenceScore ?? 0,
        completion: session.taskCompletionScore ?? 0,
        quote: session.keyQuote ?? "",
        behaviour: session.observedBehaviour ?? "",
        friction: session.frictionPoint ?? "",
        positive: session.positiveSignal ?? "",
        recommendation: session.recommendation ?? "",
      };
    })
    .filter(
      (session) =>
        session.quote ||
        session.behaviour ||
        session.friction ||
        session.positive ||
        session.recommendation ||
        session.clarity > 0 ||
        session.usefulness > 0 ||
        session.confidence > 0 ||
        session.completion > 0,
    );

  const averageTestingScore =
    testingSessions.length > 0
      ? Math.round(
          (testingSessions.reduce(
            (total, session) =>
              total + session.clarity + session.usefulness + session.confidence + session.completion,
            0,
          ) /
            (testingSessions.length * 4)) *
            10,
        ) / 10
      : 0;

      const summariseForPrint = (text: string, maxLength = 180) => {
        const cleanBlockquoteMarkers = (value: string) =>
          value
            .replace(/^>\s*/gm, "")
            .replace(/\s+>\s+/g, " — ")
            .replace(/\s+/g, " ")
            .trim();
      
        const closeUnbalancedBoldMarkers = (value: string) => {
          const markerCount = (value.match(/\*\*/g) ?? []).length;
          return markerCount % 2 === 0 ? value : `${value}**`;
        };
      
        const cleaned = cleanBlockquoteMarkers(text);
      
        const summary =
          cleaned.length <= maxLength
            ? cleaned
            : `${cleaned.slice(0, maxLength).replace(/[\s,.;:!?-]+$/, "")}…`;
      
        return closeUnbalancedBoldMarkers(summary);
      };
      
      const cleanPrintInsightTitle = (text: string) =>
        text.replace(/^\s*\d+\.\s*/, "");

      useEffect(() => {
        if (typeof window === "undefined") return;
      
        const isPrintRoute = /^\/report\/[^/]+\/print$/.test(window.location.pathname);
      
        if (!isPrintRoute) return;
      
        const timeout = window.setTimeout(() => {
          window.print();
        }, 700);
      
        return () => window.clearTimeout(timeout);
      }, []);

  return (
    <main className="bg-white px-8 py-10 text-slate-950 print:px-0 print:py-0">
      <div
        className="mx-auto mb-6 flex max-w-[920px] items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm print:hidden"
        data-print-hidden="true"
      >
        <div>
          <p className="text-sm font-black text-slate-900">Print report preview</p>
          <p className="mt-1 text-xs text-slate-500">Review the report, then print or save as PDF.</p>
        </div>

        <Button onClick={() => window.print()} aria-label="Print or save this report as a PDF">
          <Download className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          html,
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          button,
          [data-print-hidden="true"] {
            display: none !important;
          }

          .print-page-break {
            break-before: page;
            page-break-before: always;
            padding-top: 8mm;
          }

          .print-avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-section {
            padding-top: 8mm;
          }

          .print-section-label {
            margin-bottom: 0.35rem;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[920px] space-y-10 print:max-w-none print:space-y-8">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-10 text-slate-950 print:rounded-none print:border-0 print:p-0">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-purple-700 print:text-slate-500">Sprintpilot report</p>
          <h1 className="mt-8 max-w-3xl text-5xl font-black leading-tight print:text-4xl">
            {state.sprintName || "Design Sprint Report"}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700 print:text-base">
            A structured report summarising the sprint challenge, evidence, user testing outcomes, and recommended next steps.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-3 print:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 print:bg-white">
              <div className="text-3xl font-black print:text-2xl">{state.completed.length}</div>
              <div className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">Completed activities</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 print:bg-white">
              <div className="text-3xl font-black print:text-2xl">{allArtefacts.length}</div>
              <div className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">Evidence items</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 print:bg-white">
              <div className="text-3xl font-black print:text-2xl">{recommendations.length}</div>
              <div className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">Recommended actions</div>
            </div>
          </div>

          <div className="mt-12 grid gap-5 text-sm leading-7 md:grid-cols-2 print:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Challenge</p>
              <p className="mt-2 text-slate-700">{state.challenge || "No challenge statement captured."}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Desired outcome</p>
              <p className="mt-2 text-slate-700">{state.desiredOutcome || "No desired outcome captured."}</p>
            </div>
          </div>
        </section>
        <section className="print-section print-avoid-break">
          <p className="print-section-label text-xs font-black uppercase tracking-[0.3em] text-slate-500">Executive summary</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Sprint outcomes and strategic direction</h2>

          <div className="mt-5">
            <div className="space-y-4 text-[15px] leading-8 text-slate-700 print:text-[10.5pt] print:leading-7">
              <p>
                This design sprint explored <span className="font-black text-slate-950">{state.challenge || "the selected challenge"}</span> through a structured process of problem framing, evidence capture, concept development, prototyping, and user validation.
              </p>

              <p>
                Design sprints are used to help teams make faster, better-informed decisions before committing significant time, budget, or operational capacity to building a solution. By compressing discovery, ideation, prototyping, and testing into a focused sprint cycle, teams can challenge assumptions early, expose risk quickly, and avoid investing heavily in ideas that may not meet user needs.
              </p>

              <p>
                In this sprint, the team generated <span className="font-black text-slate-950">{allArtefacts.length}</span> evidence items across <span className="font-black text-slate-950">{state.completed.length}</span> completed activities. This created a clearer evidence base for deciding what should be refined, prioritised, paused, or progressed next.
              </p>

              <p>
                The sprint also supported a “fail fast” approach: rather than waiting until a fully built product or service is launched, the team tested ideas while they were still low-cost and adaptable. This helps reduce the likelihood of building the wrong thing, strengthens stakeholder confidence, and enables delivery teams to reach useful outcomes more quickly.
              </p>

              <p>
                User testing provided a clear validation signal, with <span className="font-black text-slate-950">{testingSessions.length}</span> sessions completed and an average score of <span className="font-black text-slate-950">{averageTestingScore}/5</span>. The strongest learning centred on where the concept created confidence and value for users, alongside the friction points that should be addressed before wider rollout.
              </p>

              <p>
                The recommended next steps focus on turning this evidence into practical iteration: improving clarity, reducing user friction, strengthening confidence in the experience, and preserving the elements that tested positively. This gives the team a more robust basis for decision-making before further investment or implementation.
              </p>
            </div>
          </div>
        </section>
        <section className="print-page-break">
          <p className="print-section-label text-xs font-black uppercase tracking-[0.3em] text-slate-500">Sprint journey</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">How the sprint unfolded</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm print:text-[10pt]">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 p-4">Day</th>
                  <th className="border-b border-slate-200 p-4">Focus</th>
                  <th className="border-b border-slate-200 p-4">Completed</th>
                  <th className="border-b border-slate-200 p-4">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {sprintJourney.map((entry) => (
                  <tr key={entry.day.id} className="align-top">
                    <td className="border-b border-slate-200 p-4 font-black">{entry.day.label}</td>
                    <td className="border-b border-slate-200 p-4">
                      <div className="font-black text-slate-900">{entry.day.guideLabel.replace(" Guide", "")}</div>
                      <div className="mt-1 leading-6 text-slate-600">{entry.day.summary}</div>
                    </td>
                    <td className="border-b border-slate-200 p-4">{entry.completedActivities.length}</td>
                    <td className="border-b border-slate-200 p-4">{entry.artefacts.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {testingSessions.length > 0 ? (
          <section className="print-page-break">
            <p className="print-section-label text-xs font-black uppercase tracking-[0.3em] text-slate-500">
              User testing evidence
            </p>

            <div className="mt-2 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-3xl font-black tracking-tight">What we learned from users</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  This section provides a concise summary of the strongest signal from each user testing session. Full notes and supporting evidence remain available in the online report.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-right">
                <div className="text-xs font-black uppercase tracking-wide text-slate-500">Average score</div>
                <div className="text-3xl font-black text-slate-900">{averageTestingScore}/5</div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 print:mt-5">
              <table className="w-full border-collapse text-left text-sm print:text-[10pt]">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="border-b border-slate-200 p-3">Session</th>
                    <th className="border-b border-slate-200 p-3">Score</th>
                    <th className="border-b border-slate-200 p-3">Representative quote</th>
                    <th className="border-b border-slate-200 p-3">Key insight</th>
                  </tr>
                </thead>
                <tbody>
                  {testingSessions.map((session, index) => {
                    const sessionAverage = Math.round(
                      ((session.clarity + session.usefulness + session.confidence + session.completion) / 4) * 10,
                    ) / 10;

                    const strongestInsight =
                      session.recommendation ||
                      session.friction ||
                      session.positive ||
                      session.behaviour ||
                      "No written insight summary was captured.";

                      const keyInsightSummary = session.friction
                      ? `The session highlighted friction around ${session.friction}`
                      : session.positive
                        ? `The strongest positive signal was that ${session.positive}`
                        : session.recommendation
                          ? `User feedback suggests the next iteration should focus on ${cleanPrintInsightTitle(session.recommendation)}`
                          : session.behaviour || strongestInsight;

                    return (
                      <tr key={session.key} className="align-top print-avoid-break">
                        <td className="border-b border-slate-200 p-3">
                          <div className="font-black text-slate-950">Session {index + 1}</div>
                          <div className="mt-1 text-xs leading-5 text-slate-500">
                            {session.participant}
                            {session.role ? ` — ${session.role}` : ""}
                          </div>
                        </td>
                        <td className="border-b border-slate-200 p-3 font-black text-slate-950">{sessionAverage}/5</td>
                        <td className="border-b border-slate-200 p-3 leading-6 text-slate-700">
                          {(() => {
                            const rawQuote = session.quote || "No direct quote captured.";
                            const quoteParts = rawQuote.split(/\s*>\s*/);
                            const quoteContext = quoteParts.length > 1 ? quoteParts[0]?.trim() : "";
                            const quoteText = quoteParts.length > 1 ? quoteParts.slice(1).join(" ").trim() : rawQuote;

                            return (
                              <div className="space-y-2">
                                {quoteContext ? (
                                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <InlineFormattedText text={summariseForPrint(quoteContext, 90)} />
                                  </div>
                                ) : null}

                                <blockquote className="border-l-4 border-purple-300 bg-purple-50/40 py-2 pl-4 pr-3 italic text-slate-800">
                                  <span className="text-purple-400">“</span>
                                  <InlineFormattedText text={summariseForPrint(quoteText || "No direct quote captured.", 170)} />
                                  <span className="text-purple-400">”</span>
                                </blockquote>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="border-b border-slate-200 p-3 leading-6 text-slate-700">
                          <InlineFormattedText text={keyInsightSummary} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
        <section className="print-page-break">
          <p className="print-section-label text-xs font-black uppercase tracking-[0.3em] text-slate-500">Recommended next steps</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Priority action plan</h2>
          {recommendations.length === 0 ? (
            <p className="mt-4 text-slate-600">No recommendations captured yet.</p>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm print:text-[10pt]">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 p-4">Priority</th>
                    <th className="border-b border-slate-200 p-4">Recommendation</th>
                    <th className="border-b border-slate-200 p-4">Supporting context</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.slice(0, 6).map((recommendation, index) => (
                    <tr key={recommendation.id} className="align-top">
                      <td className="border-b border-slate-200 p-4 font-black">{index + 1}</td>
                      <td className="border-b border-slate-200 p-4 font-black text-slate-900">
                        <InlineFormattedText text={cleanPrintInsightTitle(recommendation.name)} />
                      </td>
                      <td className="border-b border-slate-200 p-4 leading-6 text-slate-600">
                        <InlineFormattedText text={recommendation.caption} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="print-page-break">
          <p className="print-section-label text-xs font-black uppercase tracking-[0.3em] text-slate-500">Evidence appendix</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Captured artefacts</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3 print:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-3xl font-black">{photoArtefacts.length}</div>
              <div className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">Photos</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-3xl font-black">{noteArtefacts.length}</div>
              <div className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">Notes</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-3xl font-black">{allArtefacts.length}</div>
              <div className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">Total evidence</div>
            </div>
          </div>

          {photoArtefacts.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 print:grid-cols-2">
              {photoArtefacts.slice(0, 12).map((artefact) => (
                <figure key={artefact.id} className="print-avoid-break overflow-hidden rounded-2xl border border-slate-200">
                  {artefact.dataUrl || artefact.publicUrl ? (
                    <img
                      src={artefact.publicUrl ?? artefact.dataUrl}
                      alt={artefact.caption || artefact.name}
                      className="h-48 w-full object-cover print:h-36"
                    />
                  ) : null}
                  <figcaption className="p-3 text-sm leading-6 text-slate-600">
                    <span className="font-black text-slate-900">{artefact.name}</span>
                    {artefact.caption ? ` — ${artefact.caption}` : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function ReportPage({ state, onNavigate }: { state: AppState; onNavigate: (page: Page) => void }) {
  const isPrintReportView =
  typeof window !== "undefined" &&
  (new URLSearchParams(window.location.search).get("printReport") === "true" ||
    /^\/report\/[^/]+\/print$/.test(window.location.pathname));
  const [openJourneyDays, setOpenJourneyDays] = useState<Partial<Record<DayId, boolean>>>({});
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [openTestingSessions, setOpenTestingSessions] = useState<Record<string, boolean>>({});
  const [isPreparingPdfExport, setIsPreparingPdfExport] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [shareStatusMessage, setShareStatusMessage] = useState("");

  const allKeys = useMemo(() => {
    const keys: string[] = [];
    for (const day of sprintDays) {
      for (const a of day.activities) keys.push(activityKey(day.id, a.id));
    }
    
    return keys;
  }, []);
  const isSharedReportView =
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/report/");

  const activeReportSessionId =
  typeof window !== "undefined"
    ? window.localStorage.getItem("sprintpilot.activeSessionId.v1")
    : null;

  const shareReportUrl =
  activeReportSessionId && typeof window !== "undefined"
    ? `${window.location.origin}/report/${activeReportSessionId}`
    : "";

  const progress = useMemo(() => {
    const progressed = allKeys.filter(
      (k) => state.completed.includes(k) || state.runningActivityId === k || (state.notes[k] ?? "").trim().length > 0,
    );
    const total = allKeys.length;
    const count = progressed.length;
    const pct = total === 0 ? 0 : Math.round((count / total) * 100);
    return { total, count, pct };
  }, [allKeys, state.completed, state.notes, state.runningActivityId]);

  const notesCount = useMemo(() => Object.values(state.notes).filter((v) => v.trim().length > 0).length, [state.notes]);

  const artefactsByActivity = useMemo(() => {
    return Object.entries(state.artefacts)
      .map(([key, artefacts]) => ({ key, artefacts, context: getDayAndActivityFromKey(key) }))
      .filter((group) => group.artefacts.length > 0);
  }, [state.artefacts]);

  // --- Synthesised report values ---
  const synthesisedThemes = useMemo(() => summariseSprintThemes(state.artefacts), [state.artefacts]);
  const recommendations = useMemo(() => {
    const testingRecommendations = synthesiseTestingRecommendations(state.testingSessions);
    return testingRecommendations.length > 0 ? testingRecommendations : extractTopRecommendations(state.artefacts);
  }, [state.artefacts, state.testingSessions]);
  const totalArtefacts = useMemo(
    () => Object.values(state.artefacts).reduce((sum, artefacts) => sum + artefacts.length, 0),
    [state.artefacts],
  );

  const allArtefacts = useMemo(() => Object.values(state.artefacts).flat(), [state.artefacts]);

  const photoArtefacts = useMemo(
    () => allArtefacts.filter((artefact) => artefact.type === "photo"),
    [allArtefacts],
  );

  const insightArtefacts = useMemo(
    () =>
      allArtefacts.filter(
        (artefact) => artefact.type === "note" && (artefact.noteKind ?? "insight") === "insight",
      ),
    [allArtefacts],
  );

  const opportunityArtefacts = useMemo(
    () =>
      allArtefacts.filter(
        (artefact) => artefact.type === "note" && (artefact.noteKind ?? "insight") === "opportunity",
      ),
    [allArtefacts],
  );

  const decisionArtefacts = useMemo(
    () =>
      allArtefacts.filter(
        (artefact) => artefact.type === "note" && (artefact.noteKind ?? "insight") === "decision",
      ),
    [allArtefacts],
  );

  const riskArtefacts = useMemo(
    () =>
      allArtefacts.filter(
        (artefact) => artefact.type === "note" && (artefact.noteKind ?? "insight") === "risk",
      ),
    [allArtefacts],
  );

  const recommendationArtefacts = useMemo(
    () =>
      allArtefacts.filter(
        (artefact) => artefact.type === "note" && (artefact.noteKind ?? "insight") === "recommendation",
      ),
    [allArtefacts],
  );

  const sprintJourney = useMemo(() => buildSprintJourney(state), [state]);
  const testingSessions = Object.entries(state.testingSessions ?? {})
    .map(([key, session]) => {
      const activity = getDayAndActivityFromKey(key);
      const participantNumber = key.match(/testing-(\d+)/)?.[1];

      return {
        key,
        title: activity?.activity.title ?? "Testing Session",
        participant: session.participant?.trim() || `Participant ${participantNumber ?? ""}`.trim(),
        role: session.role ?? "",
        clarity: session.clarityScore ?? 0,
        usefulness: session.usefulnessScore ?? 0,
        confidence: session.confidenceScore ?? 0,
        completion: session.taskCompletionScore ?? 0,
        quote: session.keyQuote ?? "",
        behaviour: session.observedBehaviour ?? "",
        friction: session.frictionPoint ?? "",
        positive: session.positiveSignal ?? "",
        recommendation: session.recommendation ?? "",
      };
    })
    .filter(
      (session) =>
        session.quote ||
        session.behaviour ||
        session.friction ||
        session.positive ||
        session.recommendation ||
        session.clarity > 0 ||
        session.usefulness > 0 ||
        session.confidence > 0 ||
        session.completion > 0,
    );

  const averageTestingScore =
    testingSessions.length > 0
      ? Math.round(
          (testingSessions.reduce(
            (total, session) =>
              total + session.clarity + session.usefulness + session.confidence + session.completion,
            0,
          ) /
            (testingSessions.length * 4)) *
            10,
        ) / 10
      : 0;

      const handleExportReportPdf = () => {
        if (typeof window === "undefined") return;
      
        const currentPath = window.location.pathname.replace(/\/$/, "");
        const reportPathMatch = currentPath.match(/^\/report\/([^/]+)$/);
      
        if (reportPathMatch?.[1]) {
          window.location.href = `${currentPath}/print`;
          return;
        }
      
        window.alert("Unable to find a report session ID for PDF export.");
      };

  const executiveSummary = useMemo(() => buildExecutiveSummary(state), [state]);
  
  if (isPrintReportView) {
    return <PrintReport state={state} />;
  }

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          html,
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          header,
          nav,
          footer,
          aside,
          button,
          [data-print-hidden="true"] {
            display: none !important;
          }

          main {
            max-width: none !important;
            width: 100% !important;
            padding: 0 !important;
          }

          section,
          article,
          div {
            box-shadow: none !important;
          }

          .overflow-x-auto,
          .overflow-auto,
          .overflow-hidden {
            overflow: visible !important;
          }

          .flex.min-w-max {
            min-width: 0 !important;
            display: block !important;
          }

          .w-\[380px\] {
            width: 100% !important;
          }

          .h-\[470px\],
          .h-\[620px\],
          .h-\[640px\],
          .min-h-\[230px\],
          .min-h-\[245px\] {
            height: auto !important;
            min-height: 0 !important;
          }

          .print\:break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print\:break-before-page {
            break-before: page;
            page-break-before: always;
          }
        }
      `}</style>

      <div className="sr-only" aria-live="polite">
        {isPreparingPdfExport ? "Preparing the full sprint report for PDF export. Collapsed report sections are being expanded." : ""}
      </div>

      {!isSharedReportView ? (

      <Button variant="secondary" onClick={() => onNavigate("dashboard")} data-print-hidden="true">

        <ArrowLeft className="h-4 w-4" /> Back

      </Button>

      ) : null}

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-black">Sprint Report</h1>
          <p className="mt-1 text-slate-500">Generated from your captured sprint setup, activity progress, HMWs, and notes.</p>
        </div>

        <div className="relative flex flex-wrap items-center gap-2" data-print-hidden="true">
          <Button
            variant="secondary"
            onClick={() => setIsShareMenuOpen((current) => !current)}
            aria-label="Open report sharing options"
            aria-expanded={isShareMenuOpen}
          >
            <Send className="h-4 w-4" /> Share report
          </Button>

          {isShareMenuOpen ? (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-200/80">
              <div className="px-2 pb-2">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Share options</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Anyone with this link can open the sprint report.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!shareReportUrl) return;

                  try {
                    await navigator.clipboard.writeText(shareReportUrl);
                    setShareStatusMessage("Report link copied to clipboard.");
                    setIsShareMenuOpen(false);
                  } catch {
                    setShareStatusMessage("Copy failed. Please copy the link manually.");
                  }
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Copy className="h-4 w-4 text-purple-600" /> Copy link
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!shareReportUrl) return;
                  window.open(shareReportUrl, "_blank", "noopener,noreferrer");
                  setIsShareMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Eye className="h-4 w-4 text-purple-600" /> Open shared report
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!shareReportUrl) return;

                  const subject = encodeURIComponent(`Sprintpilot report: ${state.sprintName || "Design Sprint"}`);
                  const body = encodeURIComponent(`Here is the Sprintpilot report link:\n\n${shareReportUrl}`);

                  window.location.href = `mailto:?subject=${subject}&body=${body}`;
                  setIsShareMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Send className="h-4 w-4 text-purple-600" /> Share link by email
              </button>

              {shareReportUrl ? (
                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 break-all">
                  {shareReportUrl}
                </div>
              ) : null}
            </div>
          ) : null}

          <Button
            onClick={handleExportReportPdf}
            aria-label="Export the full sprint report as a PDF-ready print document"
          >
            <Download className="h-4 w-4" /> {isPreparingPdfExport ? "Preparing PDF…" : "Export report"}
          </Button>
        </div>
      </div>

      {shareStatusMessage ? (
        <div
          className="mt-4 rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm font-bold text-purple-900"
          role="status"
          data-print-hidden="true"
        >
          {shareStatusMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel className="p-6 lg:col-span-2 print:break-inside-avoid">
          <h2 className="text-lg font-black">Setup</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">Sprint name</div>
              <div className="mt-1 font-semibold">{state.sprintName || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">Current day</div>
              <div className="mt-1 font-semibold">{dayLabel(state.currentDay)}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">Challenge</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{state.challenge || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">Target users</div>
              <div className="mt-1 text-sm text-slate-700">{state.targetUsers || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">Desired outcome</div>
              <div className="mt-1 text-sm text-slate-700">{state.desiredOutcome || "—"}</div>
            </div>
          </div>
        </Panel>

        <Panel className="p-6 print:break-inside-avoid">
          <h2 className="text-lg font-black">Progress</h2>
          <div className="mt-4 flex items-center justify-between text-sm font-semibold">
            <span>Activities progressed</span>
            <span>
              {progress.count}/{progress.total} ({progress.pct}%)
            </span>
          </div>
          <div className="mt-3">
            <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full transition-[width] duration-500"
                style={sprintProgressFillStyle(progress.pct)}
              />
              <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
                <div className="border-r border-white/70" />
                <div className="border-r border-white/70" />
                <div className="border-r border-white/70" />
                <div />
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Completed</span>
              <span>{state.completed.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Notes saved</span>
              <span>{notesCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">HMWs saved</span>
              <span>{state.hmws.length}</span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="mt-6 overflow-hidden border-0 !bg-slate-950 text-white shadow-2xl print:break-inside-avoid">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/70">
              Executive summary
            </div>

            <h2 className="mt-5 text-3xl font-black leading-tight lg:text-4xl">
              Sprint outcomes and strategic direction
            </h2>

            <div className="mt-5 max-w-3xl space-y-4 text-base leading-8 text-white/75">
              <p>
                This Design Sprint provided a structured and evidence-led approach to exploring a complex service and user experience challenge. The sprint methodology enabled the team to move rapidly from assumptions and fragmented understanding towards clearer strategic direction and validated learning.
              </p>

              <p>
                The sprint explored the challenge of {state.challenge || "improving the current service experience"}, with a particular focus on the needs of {state.targetUsers || "users, stakeholders, and delivery teams"}. The intended outcome was {state.desiredOutcome || "a clearer and more validated future direction"}.
              </p>

              <p>
                Across the four sprint days, the team progressed through collaborative problem framing, expert insight gathering, opportunity identification, solution generation, structured decision-making, storyboarding, prototyping, and user validation activities. This resulted in {totalArtefacts} captured evidence items and the completion of {progress.count} out of {progress.total} planned sprint activities.
              </p>

              <p>
                Beyond the prototype itself, the sprint created shared understanding across stakeholders, surfaced risks and opportunities earlier in the process, and generated practical evidence to support future service, policy, operational, and delivery decisions.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-3xl font-black">{executiveSummary.decisions}</div>
                <div className="mt-1 text-xs font-black uppercase tracking-wide text-white/60">
                  Key decisions
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-3xl font-black">{executiveSummary.recommendations}</div>
                <div className="mt-1 text-xs font-black uppercase tracking-wide text-white/60">
                  Recommendations
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-3xl font-black">{executiveSummary.risks}</div>
                <div className="mt-1 text-xs font-black uppercase tracking-wide text-white/60">
                  Risks identified
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-xs font-black uppercase tracking-wide text-white/60">
              Sprint status
            </div>

            <div className="mt-4 h-4 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-white to-white/60"
                style={{ width: `${progress.pct}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-white/70">
              <span>Completion progress</span>
              <span>{progress.pct}%</span>
            </div>

            <div className="mt-8 space-y-4">
              {sprintJourney.map((entry) => (
                <div key={entry.day.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black">{entry.day.label}</div>
                      <div className="text-xs text-white/60">
                        {entry.completedActivities.length} activities completed
                      </div>
                    </div>

                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-white/80">
                      {entry.artefacts.length} artefacts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* Synthesised sprint outcome summary & recommendations */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-6 print:break-inside-avoid">
          <div>
            <div>
              <h2 className="text-lg font-black">Sprint Outcome Summary</h2>
              <p className="mt-1 text-sm text-slate-500">
                A synthesised overview of the sprint direction, evidence, decisions, and opportunities.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                Sprint challenge
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-700">
                {state.challenge || "No challenge statement captured yet."}
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                Desired outcome
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-700">
                {state.desiredOutcome || "No desired outcome captured yet."}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border bg-slate-950 p-5 text-white">
            <div className="text-xs font-black uppercase tracking-wide text-white/60">
              Sprint narrative
            </div>
            <p className="mt-3 text-sm leading-7 text-white/80">
              This sprint explored opportunities around {state.challenge || "the stated challenge"}. Throughout the sprint,
              the team generated ideas, aligned around a preferred direction, captured evidence, and documented risks,
              opportunities, decisions, and recommendations to support future product or service decisions.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
              Photos {photoArtefacts.length}
            </div>

            <div className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">
              Insights {insightArtefacts.length}
            </div>

            <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
              Opportunities {opportunityArtefacts.length}
            </div>

            <div className="rounded-full bg-purple-100 px-4 py-2 text-sm font-black text-purple-700">
              Decisions {decisionArtefacts.length}
            </div>

            <div className="rounded-full bg-red-100 px-4 py-2 text-sm font-black text-red-700">
              Risks {riskArtefacts.length}
            </div>

            <div className="rounded-full bg-cyan-100 px-4 py-2 text-sm font-black text-cyan-700">
              Recommendations {recommendationArtefacts.length}
            </div>
          </div>
        </Panel>

        <Panel className="p-6 print:break-inside-avoid">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">Recommended Next Steps</h2>
          </div>

          {recommendations.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed bg-slate-50 p-5 text-sm text-slate-500">
              No recommendations captured yet. Add recommendations in Day 4 testing sessions or as recommendation notes in activity artefacts.
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border bg-slate-50 p-6">
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                Next steps summary
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-700">
                User testing suggests the next iteration should focus on making the journey easier to understand, reducing friction at key moments, and preserving the parts of the experience that users found most valuable.
              </p>

              <div className="mt-5 space-y-3">
                {recommendations.slice(0, 4).map((artefact, index) => {
                  const accordionId = `next-step-${artefact.id}`;
                  const isOpen = expandedSections.includes(accordionId);

                  return (
                    <div
                      key={artefact.id}
                      className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSections((current) =>
                            current.includes(accordionId)
                              ? current.filter((id) => id !== accordionId)
                              : [...current, accordionId],
                          )
                        }
                        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                          {index + 1}
                        </div>

                        <div className="flex-1 text-sm font-black text-slate-900">
                          {artefact.name}
                        </div>

                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="border-t bg-slate-50 px-4 py-4">
                          <p className="text-sm leading-7 text-slate-600">
                            {artefact.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 border-t pt-4 text-sm leading-7 text-slate-600">
                Together, these actions provide a focused route into the next phase of design or delivery: refine the experience, strengthen user confidence, and carry forward the clearest positive signals from validation.
              </p>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-15">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              Part 1 · Sprint playback
            </div>
            <h2 className="mt-2 text-2xl font-black text-slate-950 lg:text-3xl">
              How the design sprint unfolded
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              A chronological playback of the sprint before moving into what was learned during user testing.
            </p>
          </div>
        </div>

        <Panel className="p-6 print:break-inside-avoid">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-black">Sprint Journey</h3>
              <p className="mt-1 text-sm text-slate-500">
                Expand each day to review the activities completed and time allocated.
              </p>
            </div>
          </div>

          <div className="mt-6 grid items-start gap-5 md:grid-cols-2 2xl:grid-cols-4">
            {sprintJourney.map((entry, index) => {
              const isOpen = Boolean(openJourneyDays[entry.day.id]);
              const Icon = entry.day.icon;

              return (
                <section
                  key={entry.day.id}
                  className={cx(
                    "flex flex-col rounded-[1.75rem] border bg-slate-50/80 p-6 shadow-md shadow-slate-200/70 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg",
                    isOpen ? "h-auto" : "h-[470px]"
                  )}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={cx(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ring-2",
                          colour[entry.day.colour].text,
                          colour[entry.day.colour].ring,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <span className="whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm ring-1 ring-slate-200">
                        {entry.completedActivities.length} completed
                      </span>
                    </div>

                    <h3 className="text-3xl font-black tracking-tight text-slate-700">
                      {entry.day.label}
                    </h3>
                  </div>

                  <div className="mt-8 min-h-[245px]">
                    <p className="text-xl font-black tracking-tight text-slate-700">
                      {entry.day.guideLabel.replace(" Guide", "")}
                    </p>

                    <p className="mt-5 text-base leading-8 text-slate-600">
                      {entry.day.summary}
                    </p>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenJourneyDays((current) => ({
                          ...current,
                          [entry.day.id]: !current[entry.day.id],
                        }))
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-md shadow-slate-200/80 ring-1 ring-slate-200 transition hover:text-slate-950"
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      {isOpen ? "Collapse" : "Expand"}
                    </button>
                  </div>

                  {isOpen ? (
                    <div className="mt-5 border-t border-slate-200 pt-5">
                      {entry.topThemes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {entry.topThemes.map((theme) => (
                            <span
                              key={theme.type.id}
                              className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white"
                            >
                              {theme.type.label} · {theme.count}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-5 grid gap-3">
                        {entry.day.activities.map((activity) => {
                          const isCompleted = state.completed.includes(
                            activityKey(entry.day.id, activity.id),
                          );

                          const duration = activity.duration;

                          return (
                            <div
                              key={activity.id}
                              className="rounded-2xl border bg-white p-4 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-black text-slate-900">
                                    {activity.title}
                                  </div>

                                  <div className="mt-2 text-sm text-slate-500">
                                    {duration} allocated
                                  </div>
                                </div>

                                <span
                                  className={cx(
                                    "rounded-full px-3 py-1 text-[11px] font-black",
                                    isCompleted
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-500",
                                  )}
                                >
                                  {isCompleted ? "Completed" : "Pending"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </Panel>

        <div className="mt-15">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                Sprint evidence & artefacts
              </div>

              <h3 className="mt-2 text-xl font-black text-slate-950 lg:text-2xl">
                Captured outputs from across the sprint
              </h3>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
                Supporting evidence, workshop captures, notes, and artefacts
                collected throughout the sprint journey.
              </p>
            </div>
          </div>

          <ReportArtefactsSection groups={artefactsByActivity} />
        </div>
      </div>

      {testingSessions.length > 0 ? (
        <div className="mt-15">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.3em] text-purple-500">
                Part 2 · Testing results
              </div>
              <h2 className="mt-2 text-2xl font-black text-slate-950 lg:text-3xl">
                What we learned from users
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
                A focused evidence section for Day 4 validation, showing what users understood, where they struggled, and what the team should do next.
              </p>
            </div>
          </div>

          <Panel className="overflow-hidden border-purple-100 bg-gradient-to-br from-purple-50 via-white to-white p-6 shadow-sm print:break-inside-avoid">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.3em] text-purple-500">
                Day 4 validation
              </div>
              <h2 className="mt-3 text-2xl font-black text-slate-950 lg:text-3xl">
                User testing session evidence
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Structured evidence captured during user testing, combining Likert scores with quotes,
                observed behaviours, friction points, positive signals, and session recommendations.
              </p>
            </div>

            <div className="rounded-3xl border border-purple-100 bg-white px-6 py-5 shadow-sm">
              <div className="text-xs font-black uppercase tracking-wide text-slate-400">
                Average validation score
              </div>
              <div className="mt-2 text-5xl font-black text-purple-600">
                {averageTestingScore}
                <span className="text-2xl text-slate-950">/5</span>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex min-w-max items-start gap-4">
              {testingSessions.map((session, index) => {
                const sessionAverage = Math.round(
                  ((session.clarity + session.usefulness + session.confidence + session.completion) / 4) * 10,
                ) / 10;
                const isTestingSessionOpen = Boolean(openTestingSessions[session.key]);

                return (
                  <section
                    key={session.key}
                    className={cx(
                      "flex w-[380px] flex-shrink-0 flex-col rounded-3xl border border-purple-100 bg-white p-5 shadow-sm",
                      isTestingSessionOpen ? "h-auto" : "h-[620px]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-purple-700">
                          Participant {index + 1}
                        </div>

                        <h3 className="mt-2 text-xl font-black text-slate-950">
                          {session.participant}
                        </h3>
                        {session.role ? <p className="mt-1 text-sm text-slate-500">{session.role}</p> : null}
                      </div>

                      <div className="rounded-2xl bg-purple-100 px-3 py-2 text-sm font-black text-purple-700">
                        {sessionAverage}/5
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                      <div className="rounded-2xl bg-purple-50 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-purple-500">Clarity</div>
                        <div className="mt-1 text-2xl font-black text-purple-700">{session.clarity}</div>
                      </div>
                      <div className="rounded-2xl bg-purple-50 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-purple-500">Useful</div>
                        <div className="mt-1 text-2xl font-black text-purple-700">{session.usefulness}</div>
                      </div>
                      <div className="rounded-2xl bg-purple-50 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-purple-500">Confidence</div>
                        <div className="mt-1 text-2xl font-black text-purple-700">{session.confidence}</div>
                      </div>
                      <div className="rounded-2xl bg-purple-50 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-purple-500">Completion</div>
                        <div className="mt-1 text-2xl font-black text-purple-700">{session.completion}</div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-1 flex-col">
                      {session.quote ? (
                        <div className="flex min-h-[230px] flex-col rounded-2xl border bg-slate-50 p-4">
                          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Key quote</div>
                          <div className="mt-2">
                          <FormattedArtefactText text={session.quote} />
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-auto flex justify-end pt-6">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenTestingSessions((current) => ({
                              ...current,
                              [session.key]: !current[session.key],
                            }))
                          }
                          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-purple-700"
                        >
                          {isTestingSessionOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          {isTestingSessionOpen ? "Show less" : "Show more evidence"}
                        </button>
                      </div>

                      {isTestingSessionOpen ? (
                        <div className="mt-6 space-y-4 border-t border-purple-100 pt-6">
                          {session.behaviour ? (
                            <div>
                              <div className="mt-6 text-xs font-black uppercase tracking-wide text-blue-500">Observed behaviour</div>
                              <div className="mt-2">
                                <FormattedArtefactText text={session.behaviour} />
                              </div>
                            </div>
                          ) : null}

                          {session.positive ? (
                            <div>
                              <div className="mt-12 text-xs font-black uppercase tracking-wide text-emerald-500">Strongest positive signal</div>
                              <div className="mt-2">
                                <SessionRecommendationText text={session.positive} />
                              </div>
                            </div>
                          ) : null}

                          {session.friction ? (
                            <div>
                              <div className="mt-12 text-xs font-black uppercase tracking-wide text-amber-500">Main friction point</div>
                              <div className="mt-2">
                                <FormattedArtefactText text={session.friction} />
                              </div>
                            </div>
                          ) : null}

                          {session.recommendation ? (
                            <div className="pt-8 rounded-2xl border border-purple-200 bg-purple-50 p-6">
                              <div className="pb-4 text-xs font-black uppercase tracking-wide text-purple-700">Session recommendation</div>
                              <div className="mt-2">
                              <SessionRecommendationText text={session.recommendation} />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
          </Panel>
        </div>
      ) : null}

      {/* Synthesised sprint themes section */}
      <div className="mt-15">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              Part 3 · Outcomes & evidence
            </div>
            <h2 className="mt-2 text-2xl font-black text-slate-950 lg:text-3xl">
              What this means for the next step
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              Synthesised themes, decisions, recommendations, and the underlying evidence captured during the sprint.
            </p>
          </div>
        </div>

        <Panel className="p-6 print:break-inside-avoid">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black">Synthesised Sprint Themes</h2>
            <p className="mt-1 text-sm text-slate-500">
              Grouped insights, opportunities, decisions, risks, and recommendations captured across the sprint.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            {synthesisedThemes.length} themes
          </span>
        </div>

        {synthesisedThemes.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed bg-slate-50 p-5 text-sm text-slate-500">
            No synthesised themes captured yet.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {synthesisedThemes.map((group) => {
              const Icon = group.type.icon;

              return (
                <section key={group.type.id} className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cx(
                        "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white",
                        group.type.color,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div>
                      <h3 className="font-black">{group.type.label}</h3>
                      <p className="text-xs text-slate-500">
                        {group.artefacts.length} captured items
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {group.artefacts.slice(0, 6).map((artefact) => (
                      <div key={artefact.id} className="rounded-xl border bg-white p-3">
                        <div className="text-sm font-black text-slate-900">
                          {artefact.name || "Untitled note"}
                        </div>
                        <div className="mt-1 text-sm leading-6 text-slate-600">
                          {artefact.caption || "No additional detail added."}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-black">How Might We</h2>
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{state.hmws.length} saved</span>
          </div>
          {state.hmws.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No HMW questions saved yet.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {state.hmws.slice(0, 12).map((q) => (
                <li key={q} className="rounded-xl border bg-white p-3">
                  {q}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="p-6">
          <h2 className="text-lg font-black">Notes</h2>
          <p className="mt-1 text-sm text-slate-500">Top notes captured during activities.</p>
          <div className="mt-4 space-y-3">
            {Object.entries(state.notes)
              .filter(([, v]) => v.trim().length > 0)
              .slice(0, 8)
              .map(([key, value]) => (
                <div key={key} className="rounded-2xl border bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-wide text-slate-500">{key}</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{value.slice(0, 500)}</div>
                </div>
              ))}
            {notesCount === 0 ? <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">No activity notes yet.</div> : null}
          </div>
        </Panel>
      </div>
    </main>
  );
}

export default function DesignSprintFacilitatorApp() {
  const [page, setPage] = useState<Page>(() => {
    if (typeof window === "undefined") return "dashboard";
  
    const params = new URLSearchParams(window.location.search);
    const hasSharedReportUrl =
      params.has("reportSessionId") || /^\/report\/[^/]+(?:\/print)?$/.test(window.location.pathname);
  
    return hasSharedReportUrl ? "report" : "dashboard";
  });
  const [state, dispatch] = useReducer(reducer, initialState);
  const lastRealtimeStateRef = useRef<string | null>(null);
  const lastLocalSaveAtRef = useRef(0);
  const activeSessionIdRef = useRef<string | null>(null);
  const [facilitatorMode, setFacilitatorMode] = useState(false);
  useEffect(() => {
    if (!facilitatorMode) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [facilitatorMode]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [hasLoadedSavedSession, setHasLoadedSavedSession] = useState(false);
  const isSharedReportView =
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/report/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryReportSessionId = params.get("reportSessionId");
    const pathReportMatch = window.location.pathname.match(/^\/report\/([^/]+)(?:\/print)?$/);
    const reportSessionId = queryReportSessionId ?? pathReportMatch?.[1] ?? null;

    if (!reportSessionId) return;

    const sharedReportSessionId = decodeURIComponent(reportSessionId);
  
    let isMounted = true;
  
    async function loadSharedReport() {
      const cloudSession = await fetchCloudSessionById(sharedReportSessionId);
      if (!isMounted || !cloudSession) return;
  
      const existingSessions = readStoredSessions();
      const nextSessions = [
        cloudSession,
        ...existingSessions.filter((session) => session.id !== cloudSession.id),
      ];
  
      writeStoredSessions(nextSessions);
      setActiveSessionId(cloudSession.id);
      dispatch({ type: "session/replace", state: cloudSession.state });
      setPage("report");
    }
  
    void loadSharedReport();
  
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (hasLoadedSavedSession) return;
  
    const fallback = window.setTimeout(() => {
      console.warn("SprintPilot session load fallback triggered");
      setHasLoadedSavedSession(true);
    }, 3000);
  
    return () => window.clearTimeout(fallback);
  }, [hasLoadedSavedSession]);

  useEffect(() => {
    let cancelled = false;
  
    async function loadSession() {
      const localSession = loadActiveSession();
  
      if (supabase) {
        const liveCloudSession = await loadLatestLiveCloudSession();
        if (cancelled) return;
  
        if (liveCloudSession) {
          const existingSessions = readStoredSessions();
          const mergedSessions = [
            liveCloudSession,
            ...existingSessions.filter(
              (session) =>
                session.id !== liveCloudSession.id &&
                session.cloudId !== liveCloudSession.cloudId,
            ),
          ];
  
          writeStoredSessions(mergedSessions);

          if (typeof window !== "undefined") {
            window.localStorage.setItem(SPRINTPILOT_ACTIVE_SESSION_KEY, liveCloudSession.id);
          }

          activeSessionIdRef.current = liveCloudSession.id;
          setActiveSessionId(liveCloudSession.id);
          dispatch({
            type: "session/replace",
            state: normaliseAppState(liveCloudSession.state),
          });
          setHasLoadedSavedSession(true);
          return;
        }
      }
  
      if (cancelled) return;
  
      setActiveSessionId(localSession.id);
      activeSessionIdRef.current = localSession.id;
      dispatch({
        type: "session/replace",
        state: normaliseAppState(localSession.state),
      });
      setHasLoadedSavedSession(true);
    }
  
    void loadSession();
  
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [page]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // AUTOSAVE EFFECT
  useEffect(() => {
    if (!hasLoadedSavedSession || !activeSessionId) return;

    // Participant mode is a read-only display surface. Only facilitator mode should write sprint state.
    if (!facilitatorMode) return;

    const stateSignature = JSON.stringify(state);
    if (lastRealtimeStateRef.current === stateSignature) {
      lastRealtimeStateRef.current = null;
      return;
    }

    const timeout = window.setTimeout(() => {
      lastLocalSaveAtRef.current = Date.now();
      saveSessionState(activeSessionId, state);

      const activeSession = readStoredSessions().find((session) => session.id === activeSessionId);
      const broadcastSessionId = activeSession?.cloudId ?? activeSession?.id ?? activeSessionId;

      if (supabase && broadcastSessionId) {
        void supabase.channel(`sprint_session_live_${broadcastSessionId}`).send({
          type: "broadcast",
          event: "state_update",
          payload: {
            sessionId: broadcastSessionId,
            state,
            sentAt: Date.now(),
          },
        });
      }
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [activeSessionId, facilitatorMode, hasLoadedSavedSession, state]);

  // REALTIME EFFECT
  useEffect(() => {
    if (!supabase || !activeSessionId) return;

    const storedSessions = readStoredSessions();
    const activeSession = storedSessions.find((session) => session.id === activeSessionId);
    const broadcastSessionId = activeSession?.cloudId ?? activeSession?.id ?? activeSessionId;

    const broadcastChannel = supabase
      .channel(`sprint_session_live_${broadcastSessionId}`)
      .on("broadcast", { event: "state_update" }, ({ payload }) => {
        if (!payload?.state) return;

        console.log("Sprint broadcast update received", payload.sessionId);

        const incomingTimestamp = payload?.sentAt ?? 0;
        if (incomingTimestamp && incomingTimestamp <= lastLocalSaveAtRef.current) return;

        const nextState = normaliseAppState(payload.state as AppState);
        const stateSignature = JSON.stringify(nextState);
        lastRealtimeStateRef.current = stateSignature;
        dispatch({ type: "session/replace", state: nextState });
      })
      .subscribe((status) => {
        console.log("Sprint broadcast status", status);
      });

    const postgresChannel = supabase
      .channel("sprint_sessions_realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sprint_sessions",
        },
        (payload) => {
          const updated = payload.new as unknown as CloudSprintSessionRow;
          if (!updated?.id || !updated?.session_data) return;

          const currentActiveSessionId = activeSessionIdRef.current;
          const currentStoredSessions = readStoredSessions();
          const currentSession = currentStoredSessions.find((session) => session.id === currentActiveSessionId);
          const activeCloudId = currentSession?.cloudId ?? currentSession?.id ?? currentActiveSessionId;

          console.log("Sprint postgres realtime update received", {
            updatedId: updated.id,
            currentActiveSessionId,
            activeCloudId,
          });

          if (updated.id !== currentActiveSessionId && updated.id !== activeCloudId) return;

          const incomingUpdatedAt = updated.updated_at ? new Date(updated.updated_at).getTime() : 0;
          if (incomingUpdatedAt && incomingUpdatedAt <= lastLocalSaveAtRef.current) return;

          const nextState = normaliseAppState(updated.session_data);
          const stateSignature = JSON.stringify(nextState);
          lastRealtimeStateRef.current = stateSignature;
          dispatch({ type: "session/replace", state: nextState });
        },
      )
      .subscribe((status) => {
        console.log("Sprint postgres realtime status", status);
      });

    return () => {
      if (!supabase) return;

      void supabase.removeChannel(broadcastChannel);
      void supabase.removeChannel(postgresChannel);
    };
  }, [activeSessionId]);

  // HOOKS MOVED ABOVE LOADING GUARD
  const [hmwOpen, setHmwOpen] = useState(false);
  const currentDay = useMemo(() => sprintDays.find((day) => day.id === page), [page]);

  if (!hasLoadedSavedSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#070617] text-sm font-black text-white">
            DS
          </div>
          <h1 className="mt-4 text-xl font-black text-slate-950">Loading sprint session…</h1>
          <p className="mt-2 text-sm text-slate-500">Restoring your saved sprint workspace.</p>
        </div>
      </main>
    );
  }

  const onNavigate = (nextPage: Page) => {
    setPage(nextPage);
    if (DAY_IDS.includes(nextPage as DayId)) dispatch({ type: "nav/setDay", dayId: nextPage as DayId });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-950" style={{ fontFamily: "Roboto, Arial, Helvetica, sans-serif" }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      {page !== "participant" ? 
      <Header
        page={page}
        onNavigate={onNavigate}
        currentDay={state.currentDay}
        sprintName={state.sprintName}
        facilitatorMode={facilitatorMode}
        setFacilitatorMode={setFacilitatorMode}
      /> : null}

      <div id="main">
        {page === "dashboard" ? (
          <Dashboard
            state={state}
            dispatch={dispatch}
            onNavigate={onNavigate}
            openHmw={() => setHmwOpen(true)}
            facilitatorMode={facilitatorMode}
          />
        ) : null}
        {page === "participant" ? <ParticipantView state={state} /> : null}

        {currentDay ? (
          <DayPage
            day={currentDay}
            state={state}
            dispatch={dispatch}
            onNavigate={onNavigate}
            openHmw={() => setHmwOpen(true)}
            facilitatorMode={facilitatorMode}
          />
        ) : null}

        {page === "timer" ? <TimerPage state={state} dispatch={dispatch} onNavigate={onNavigate} facilitatorMode={facilitatorMode} /> : null}
        {page === "resources" ? <ResourcesPage setPage={onNavigate} /> : null}
        {page === "report" ? <ReportPage state={state} onNavigate={onNavigate} /> : null}
        {page === "repository" && facilitatorMode ? (
          <RepositoryPage
            activeSessionId={activeSessionId}
            currentState={state}
            dispatch={dispatch}
            setActiveSessionId={setActiveSessionId}
            onNavigate={onNavigate}
          />
        ) : null}
      </div>

      {page !== "participant" ? (
        <footer className="mt-16 border-t bg-slate-50 py-8 text-center text-sm text-slate-500">
          <p>Design Sprint Facilitator - Your complete guide to running successful 4-day design sprints</p>
          <p className="mt-2">Built for design teams, product managers, and innovation facilitators</p>
        </footer>
      ) : null}

      {page !== "participant" ? <HmwModal open={hmwOpen} onClose={() => setHmwOpen(false)} state={state} dispatch={dispatch} /> : null}
    </div>
  );
}

function NoteArtefactPreview({ artefact }: { artefact: Artefact }) {
  const noteType = getNoteArtefactType(artefact.noteKind);
  const Icon = noteType.icon;

  return (
    <div className={cx("flex h-36 flex-col justify-between p-4 text-white rounded-xl bg-gradient-to-br", noteType.color)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black">
          <Icon className="h-3.5 w-3.5" /> {noteType.label}
        </div>
      </div>
      <div>
        <div className="line-clamp-2 text-lg font-black">{artefact.name || "Untitled note"}</div>
        <div className="mt-1 line-clamp-2 text-sm text-white/65">{artefact.caption || "Add note details below."}</div>
      </div>
    </div>
  );
}