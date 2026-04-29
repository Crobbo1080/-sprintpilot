"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Bot, CheckCircle2, Clock, Copy, Download, Eye, HelpCircle, Home, Lightbulb, Mic, Minus, Play, Plus, RefreshCw, Send, Settings, Star, Target, Timer, Users, Wrench, X, Zap } from "lucide-react";

type Page = "dashboard" | "day1" | "day2" | "day3" | "day4" | "timer" | "resources";
type DayId = "day1" | "day2" | "day3" | "day4";
type Tab = "schedule" | "activities" | "guide" | "resources";
type ResourceTab = "templates" | "facilitation";
type HmwTab = "generate" | "saved" | "templates" | "guide";
type Colour = "blue" | "green" | "orange" | "purple";

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

type SprintDay = {
  id: DayId;
  label: string;
  title: string;
  subtitle: string;
  duration: string;
  colour: Colour;
  icon: React.ElementType;
  goal: string;
  middleLabel: string;
  middle: string;
  outcome: string;
  guideLabel: string;
  schedule: Array<{ time: string; title: string; duration: string; isBreak?: boolean }>;
  activities: Activity[];
};

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const colour = {
  blue: { solid: "bg-blue-600 text-white", text: "text-blue-600", soft: "bg-blue-50 text-blue-700 border-blue-200" },
  green: { solid: "bg-emerald-600 text-white", text: "text-emerald-600", soft: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  orange: { solid: "bg-orange-600 text-white", text: "text-orange-600", soft: "bg-orange-50 text-orange-700 border-orange-200" },
  purple: { solid: "bg-purple-600 text-white", text: "text-purple-600", soft: "bg-purple-50 text-purple-700 border-purple-200" },
};

const day1Activities: Activity[] = [
  { id: "kickoff", title: "Sprint Kickoff", duration: "30 min", description: "Set the stage, align the team, and establish ground rules for the sprint.", participants: "All team members", materials: ["Agenda", "Sprint canvas", "Name tags"], deliverable: "Aligned team with clear sprint goals", tips: ["Start with introductions if needed", "Communicate the sprint format and expectations", "Create a parking lot for off-topic discussion"], guideTitle: "Sprint Planning & Preparation Guide", guideSubtitle: "Complete guide for setting up and preparing your design sprint for maximum success" },
  { id: "mapping", title: "Problem Mapping", duration: "60 min", description: "Create a visual map of the user journey to identify key problems and opportunities.", participants: "All team members", materials: ["Large sheets of paper", "Sticky notes", "Markers", "Timer"], deliverable: "Complete user journey map with pain points identified", tips: ["Focus on the user journey, not internal processes", "Separate assumptions from known facts", "Keep the map visible throughout the sprint"], guideTitle: "Problem Mapping Facilitation Guide", guideSubtitle: "How to facilitate effective problem mapping sessions to understand the challenge landscape" },
  { id: "interviews", title: "Expert Interviews", duration: "90 min", description: "Gather insight from people who understand the problem, users, operations, or constraints.", participants: "Experts + sprint team", materials: ["Interview questions", "Note sheets", "Timer"], deliverable: "Key insights and assumptions captured", tips: ["Ask open questions", "Keep interviews short and focused", "Capture direct quotes where useful"], guideTitle: "Expert Interview Facilitation Guide", guideSubtitle: "How to conduct effective expert interviews to gather insights and understand the problem deeply" },
  { id: "hmw", title: "How Might We", duration: "45 min", description: "Transform problems, insights, and opportunities into How Might We questions.", participants: "All team members", materials: ["Sticky notes", "Markers", "Timer"], deliverable: "50+ How Might We questions", tips: ["Start questions with ‘How might we…’", "One idea per sticky note", "Build on others’ ideas", "Go for quantity before quality"], guideTitle: "How Might We Workshop Guide", guideSubtitle: "Transform problems into opportunities with structured HMW question generation" },
  { id: "target", title: "Target Selection", duration: "45 min", description: "Choose the most important challenge or opportunity to focus on for the sprint.", participants: "All team members", materials: ["Voting dots", "Decision matrix", "Timer"], deliverable: "One target problem or opportunity selected", tips: ["Consider impact vs effort", "The Decider has the final say", "Choose something that can be prototyped and tested"], guideTitle: "Voting & Decision Framework", guideSubtitle: "Structured approach for making decisions and selecting targets" },
];

const sprintDays: SprintDay[] = [
  { id: "day1", label: "Day 1", title: "Day 1: Understand & Define", subtitle: "Map the problem, interview experts, and define the challenge", duration: "6-8 hours", colour: "blue", icon: Target, goal: "Define the right problem to solve", middleLabel: "Team", middle: "5-7 people including Decider", outcome: "Target problem selected", guideLabel: "Resources", schedule: [{ time: "9:00 AM", title: "Sprint Kickoff", duration: "30 min" }, { time: "9:30 AM", title: "Problem Mapping", duration: "60 min" }, { time: "10:30 AM", title: "Break", duration: "15 min", isBreak: true }, { time: "10:45 AM", title: "Expert Interviews", duration: "90 min" }, { time: "12:15 PM", title: "Lunch", duration: "60 min", isBreak: true }, { time: "1:15 PM", title: "How Might We", duration: "45 min" }, { time: "2:00 PM", title: "Break", duration: "15 min", isBreak: true }, { time: "2:15 PM", title: "Target Selection", duration: "45 min" }, { time: "3:00 PM", title: "Day 1 Wrap-up", duration: "30 min" }], activities: day1Activities },
  { id: "day2", label: "Day 2", title: "Day 2: Ideate & Decide", subtitle: "Generate solutions and decide on the best approach", duration: "6-8 hours", colour: "green", icon: Lightbulb, goal: "Select the best solution to prototype", middleLabel: "Focus", middle: "Individual work then group decisions", outcome: "Winning solution ready to prototype", guideLabel: "Sketching Guide", schedule: [{ time: "9:00 AM", title: "Day 2 Kickoff", duration: "15 min" }, { time: "9:15 AM", title: "Lightning Demos", duration: "45 min" }, { time: "10:15 AM", title: "Four-Step Sketch", duration: "90 min" }, { time: "12:00 PM", title: "Lunch", duration: "60 min", isBreak: true }, { time: "1:00 PM", title: "Art Museum", duration: "30 min" }, { time: "1:30 PM", title: "Speed Critique", duration: "60 min" }, { time: "3:00 PM", title: "Supervote", duration: "30 min" }], activities: [{ ...day1Activities[0], id: "lightning", title: "Lightning Demos", duration: "45 min", description: "Quick presentations of existing solutions and inspiration from other industries.", deliverable: "Collection of inspiring solutions and patterns" }, { ...day1Activities[3], id: "sketch", title: "Four-Step Sketch", duration: "90 min", description: "Individual sketching exercise to generate detailed solution ideas.", deliverable: "Individual solution sketches from each team member" }, { ...day1Activities[4], id: "supervote", title: "Supervote", duration: "30 min", description: "The Decider makes the final choice on what concept to prototype.", deliverable: "Winning concept selected" }] },
  { id: "day3", label: "Day 3", title: "Day 3: Prototype", subtitle: "Build a realistic prototype of your solution", duration: "6-8 hours", colour: "orange", icon: Wrench, goal: "Create a testable prototype", middleLabel: "Approach", middle: "Divide and conquer with roles", outcome: "Ready-to-test prototype", guideLabel: "Prototyping Guide", schedule: [{ time: "9:00 AM", title: "Day 3 Kickoff", duration: "15 min" }, { time: "9:15 AM", title: "Storyboard Creation", duration: "60 min" }, { time: "10:30 AM", title: "Prototype Planning", duration: "45 min" }, { time: "11:15 AM", title: "Prototype Building", duration: "5 hours" }, { time: "4:15 PM", title: "Prototype Review", duration: "45 min" }], activities: [{ ...day1Activities[1], id: "storyboard", title: "Storyboard Creation", duration: "60 min", description: "Create a step-by-step storyboard of the user experience.", deliverable: "Complete user journey storyboard" }, { ...day1Activities[4], id: "planning", title: "Prototype Planning", duration: "45 min", description: "Plan the prototype structure and assign responsibilities.", deliverable: "Prototype plan with clear responsibilities" }, { ...day1Activities[2], id: "building", title: "Prototype Building", duration: "5 hours", description: "Build a realistic-enough prototype that users can react to.", deliverable: "Realistic prototype ready for review" }] },
  { id: "day4", label: "Day 4", title: "Day 4: Test & Validate", subtitle: "Test with real users and gather feedback", duration: "4-6 hours", colour: "purple", icon: Zap, goal: "Validate solution with real users", middleLabel: "Users", middle: "5 individual testing sessions", outcome: "Validated insights & next steps", guideLabel: "Testing Guide", schedule: [{ time: "9:00 AM", title: "Day 4 Kickoff", duration: "15 min" }, { time: "9:15 AM", title: "Test Preparation", duration: "45 min" }, { time: "10:00 AM", title: "User Testing - Session 1", duration: "30 min" }, { time: "10:45 AM", title: "User Testing - Session 2", duration: "30 min" }, { time: "11:30 AM", title: "User Testing - Session 3", duration: "30 min" }, { time: "1:00 PM", title: "User Testing - Session 4", duration: "30 min" }, { time: "1:45 PM", title: "User Testing - Session 5", duration: "30 min" }, { time: "2:30 PM", title: "Results Analysis", duration: "60 min" }], activities: [{ ...day1Activities[0], id: "prep", title: "Test Preparation", duration: "45 min", description: "Prepare for user testing sessions — scripts, logistics, and roles.", deliverable: "Ready testing environment and materials" }, { ...day1Activities[2], id: "testing", title: "User Testing Sessions", duration: "3 hours", description: "Conduct 5 individual user testing sessions with your prototype.", deliverable: "User feedback and behavioural observations" }, { ...day1Activities[1], id: "analysis", title: "Results Analysis", duration: "60 min", description: "Look for patterns, validated assumptions, warning signs, and next steps.", deliverable: "Validated learning and recommended next actions" }] },
];

const resources = ["Sprint Planning & Preparation Guide", "Problem Mapping Facilitation Guide", "Expert Interview Facilitation Guide", "How Might We Workshop Guide", "User Testing Preparation Guide", "User Testing Facilitation Guide", "Test Results Analysis Guide", "Sprint Validation Framework"];

function Button({ children, className, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return <button {...props} className={cx("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2", variant === "primary" && "bg-[#070617] text-white hover:bg-slate-800", variant === "secondary" && "border border-slate-200 bg-white text-slate-950 hover:bg-slate-50", variant === "ghost" && "text-slate-700 hover:bg-slate-100", className)}>{children}</button>;
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cx("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>{children}</section>;
}

function Header({ page, setPage, currentDay }: { page: Page; setPage: (page: Page) => void; currentDay: DayId }) {
  const items = [{ id: "dashboard" as Page, label: "Dashboard", icon: Home }, ...sprintDays.map((d) => ({ id: d.id as Page, label: d.label, icon: d.icon, colour: d.colour })), { id: "timer" as Page, label: "Timer", icon: Clock }, { id: "resources" as Page, label: "Resources", icon: BookOpen }];
  return <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3"><button onClick={() => setPage("dashboard")} className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#070617] text-xs font-black text-white">DS</span><span className="hidden text-sm font-black sm:inline">Design Sprint Facilitator</span></button><nav className="hidden items-center gap-1 lg:flex">{items.map((item) => { const Icon = item.icon; const active = page === item.id; const c = "colour" in item && item.colour ? colour[item.colour] : undefined; return <button key={item.id} onClick={() => setPage(item.id)} className={cx("inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold", active ? "bg-[#070617] text-white" : "text-slate-700 hover:bg-slate-100", active && c?.solid)}><Icon className={cx("h-4 w-4", !active && c?.text)} />{item.label}</button>; })}</nav><div className="flex items-center gap-2"><span className="rounded-lg border px-3 py-1 text-xs font-bold">Sprint Day {currentDay.replace("day", "")}/4</span><Button variant="secondary" className="hidden px-3 py-1.5 sm:flex"><Settings className="h-4 w-4" /> Settings</Button></div></div></header>;
}

function Dashboard({ state, setPage, openHmw }: { state: { currentDay: DayId; completed: string[] }; setPage: (page: Page) => void; openHmw: () => void }) {
  const total = sprintDays.reduce((sum, day) => sum + day.activities.length, 0);
  const progress = Math.max(25, Math.round((state.completed.length / total) * 100));
  return <main className="mx-auto max-w-[1280px] px-6 py-8"><div className="text-center"><h1 className="text-4xl font-black tracking-tight md:text-5xl">Design Sprint Facilitator</h1><p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">A comprehensive guide to running successful 4-day design sprints. Follow the structured process to help your team solve big challenges and test new ideas quickly.</p></div><Panel className="mt-8 bg-[#070617] p-6 text-white"><h2 className="flex items-center gap-2 text-lg font-black"><BookOpen className="h-5 w-5" /> Sprint Overview</h2><div className="mt-8 grid gap-6 md:grid-cols-3"><div className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4" /> 4 Days Total</div><div className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" /> 5-7 Participants</div><div className="flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4" /> Validate A Solution</div></div><div className="mt-7 flex items-center justify-between text-sm font-semibold"><span>Sprint Progress</span><span>{progress}% complete</span></div><div className="mt-3 h-3 rounded-full bg-blue-950"><div className="h-3 rounded-full bg-blue-500" style={{ width: `${progress}%` }} /></div></Panel><div className="mt-6 grid gap-5 lg:grid-cols-2">{sprintDays.map((day) => { const Icon = day.icon; const c = colour[day.colour]; const active = state.currentDay === day.id; return <Panel key={day.id} className={cx("p-5", active && "border-2 border-[#070617]")}><div className="flex items-start gap-4"><div className={cx("rounded-xl p-3", c.solid)}><Icon className="h-5 w-5" /></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-black">{day.title}</h2>{active && <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">In progress</span>}</div><p className="mt-1 text-sm text-slate-500">{day.duration}</p></div></div><p className="mt-7 text-sm leading-6 text-slate-700">{day.subtitle}</p><p className="mt-5 text-sm font-black">Key Activities:</p><div className="mt-2 flex flex-wrap gap-2">{day.activities.slice(0, 4).map((a) => <span key={a.id} className="rounded-md border px-2 py-1 text-xs font-semibold">{a.title}</span>)}</div><Button className="mt-5 w-full" variant={active ? "primary" : "secondary"} onClick={() => setPage(day.id)}>{active ? "Continue" : "Start"} {day.label}</Button></Panel>; })}</div><QuickActions setPage={setPage} openHmw={openHmw} /></main>;
}

function QuickActions({ setPage, openHmw }: { setPage: (page: Page) => void; openHmw: () => void }) {
  const actions = [["Saved HMW Questions", "No saved questions yet", CheckCircle2, openHmw], ["Template Library", "Access worksheets and templates", BookOpen, () => setPage("resources")], ["Timer & Tools", "Time-boxing utilities", Timer, () => setPage("timer")], ["Facilitator Guidance", "Tips and best practices", Star, () => setPage("resources")]] as const;
  return <Panel className="mt-6 p-5"><h2 className="text-lg font-black">Quick Actions</h2><div className="mt-5 grid gap-3 md:grid-cols-4">{actions.map(([title, desc, Icon, action]) => <button key={title} onClick={action} className="rounded-xl border p-4 text-left hover:bg-slate-50"><Icon className="mb-3 h-4 w-4 text-slate-600" /><strong className="block text-sm">{title}</strong><span className="mt-1 block text-sm text-slate-500">{desc}</span></button>)}</div></Panel>;
}

function DayPage({ day, state, setState, setPage, openHmw }: { day: SprintDay; state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; setPage: (page: Page) => void; openHmw: () => void }) {
  const [tab, setTab] = useState<Tab>("schedule");
  const c = colour[day.colour];
  const Icon = day.icon;
  return <main className="mx-auto max-w-[1280px] px-6 py-8"><Button variant="secondary" onClick={() => setPage("dashboard")}><ArrowLeft className="h-4 w-4" /> Back</Button><div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-black tracking-tight">{day.title}</h1><span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">In progress</span></div><p className="mt-1 text-lg text-slate-500">{day.subtitle}</p></div><span className="w-fit rounded-lg border px-3 py-2 text-sm font-bold">{day.duration}</span></div><div className="mt-6 grid gap-4 md:grid-cols-3">
  <Metric icon={Icon} label="Goal" value={day.goal} tone={c.text} />
  <Metric icon={Users} label={day.middleLabel} value={day.middle} tone="text-emerald-600" />
  <Metric icon={CheckCircle2} label="Outcome" value={day.outcome} tone="text-orange-600" />
</div>

<div className="mt-6 grid grid-cols-4 rounded-2xl bg-slate-100 p-1">{(["schedule", "activities", "guide", "resources"] as Tab[]).map((t) => <button key={t} onClick={() => setTab(t)} className={cx("rounded-xl py-2 text-sm font-black capitalize text-slate-700", tab === t && "bg-white text-slate-950 shadow-sm")}>{t === "guide" ? day.guideLabel : t}</button>)}</div>{tab === "schedule" && <Schedule day={day} />}{tab === "activities" && <Activities day={day} state={state} setState={setState} openHmw={openHmw} />}{tab === "guide" && <Guide day={day} />}{tab === "resources" && <DayResources day={day} openHmw={openHmw} />}<QuickActions setPage={setPage} openHmw={openHmw} /></main>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) {
  return <Panel className="p-5"><div className="flex items-center gap-2"><Icon className={cx("h-4 w-4", tone)} /><strong>{label}</strong></div><p className="mt-2 text-slate-500">{value}</p></Panel>;
}

function Schedule({ day }: { day: SprintDay }) {
  const c = colour[day.colour];
  return <Panel className="mt-3 p-5"><h2 className="flex items-center gap-2 text-xl font-black"><Clock className="h-5 w-5" /> {day.label} Schedule</h2><div className="mt-6 space-y-3">{day.schedule.map((item) => <div key={`${item.time}-${item.title}`} className={cx("flex items-center justify-between gap-3 rounded-xl border p-3", item.isBreak ? c.soft : "border-slate-200 bg-white")}><div className="flex min-w-0 items-center gap-3"><span className="shrink-0 rounded-lg border bg-white px-2 py-1 text-xs font-black text-slate-800">{item.time}</span><strong className="truncate text-sm">{item.title}</strong></div><span className="shrink-0 text-sm font-semibold text-slate-500">{item.duration}</span></div>)}</div></Panel>;
}

type AppState = { currentDay: DayId; completed: string[]; notes: Record<string, string>; hmws: string[] };

function Activities({ day, state, setState, openHmw }: { day: SprintDay; state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; openHmw: () => void }) {
  const c = colour[day.colour];
  const toggle = (id: string) =>
    setState((s) => ({
      ...s,
      completed: s.completed.includes(id)
        ? s.completed.filter((x) => x !== id)
        : [...s.completed, id],
      runningActivityId: s.runningActivityId === id ? undefined : s.runningActivityId,
    }));
  
  const startActivity = (id: string) =>
    setState((s) => ({
      ...s,
      runningActivityId: id,
    }));
  return <div className="mt-3 space-y-4">{day.activities.map((a, index) => { const done = state.completed.includes(`${day.id}-${a.id}`); const key = `${day.id}-${a.id}`; return <Panel key={key} className="p-5"><div className="flex items-start justify-between gap-4"><h2 className="flex items-center gap-2 text-lg font-black"><span className={cx("flex h-6 w-6 items-center justify-center rounded-full text-xs", c.solid)}>{index + 1}</span>{a.title}</h2>{state.runningActivityId === key && (
    <span className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
      Running now
    </span>
  )}</div><p className="mt-7 text-base leading-7 text-slate-700">{a.description}</p><div className="mt-5 grid gap-10 md:grid-cols-2"><div><strong className="flex items-center gap-2"><Users className="h-4 w-4" /> Participants</strong><p className="mt-2 text-sm text-slate-500">{a.participants}</p></div><div><strong>Materials Needed</strong><ul className="mt-2 list-inside list-disc text-sm leading-6 text-slate-500">{a.materials.map((m) => <li key={m}>{m}</li>)}</ul></div></div><div className="mt-7 grid gap-8 md:grid-cols-2"><div><strong>Deliverable</strong><p className="mt-2 text-sm text-slate-500">{a.deliverable}</p></div><div><strong>Facilitator Tips</strong><ul className="mt-2 space-y-1 text-sm leading-6 text-slate-500">{a.tips.map((tip) => <li key={tip}>💡 {tip}</li>)}</ul></div></div><div className="mt-6 rounded-xl border bg-slate-50 p-3"><label htmlFor={`${key}-notes`} className="text-sm font-black">Activity notes</label><textarea id={`${key}-notes`} value={state.notes[key] ?? ""} onChange={(e) => setState((s) => ({ ...s, notes: { ...s.notes, [key]: e.target.value } }))} className="mt-2 min-h-24 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950" placeholder="Capture outputs, decisions, observations, and evidence..." /></div><div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border p-3"><BookOpen className="h-4 w-4 text-slate-600" /><div className="min-w-0 flex-1"><strong className="text-sm">{a.guideTitle}</strong><p className="truncate text-xs text-slate-500">{a.guideSubtitle}</p></div>{a.title === "How Might We" && <Button variant="secondary" onClick={openHmw}>Open Tool</Button>}<Button variant="secondary" onClick={() => startActivity(key)}>
  <Play className="h-4 w-4" /> Run
</Button>

<Button variant={done ? "primary" : "secondary"} onClick={() => toggle(key)}>{done ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-4 w-4" />} {done ? "Completed" : "Mark complete"}</Button></div></Panel>; })}</div>;
}

function Guide({ day }: { day: SprintDay }) {
  if (day.id === "day2") return <GuidePanel title="Four-Step Sketch Process" items={["Notes — review yesterday’s work", "Ideas — rough approaches", "Crazy 8s — eight variations in eight minutes", "Solution Sketch — detailed, self-explanatory concept"]} />;
  if (day.id === "day3") return <GuidePanel title="Prototyping Best Practices" items={["Focus on the critical path", "Use realistic content", "Make it feel authentic", "Do not build the whole product", "Fake anything that does not need to work"]} />;
  if (day.id === "day4") return <GuidePanel title="Testing Guide" items={["Recruit representative users", "Ask open-ended questions", "Observe behaviour over opinions", "Debrief after each session", "Look for repeated patterns"]} />;
  return <DayResources day={day} openHmw={() => undefined} />;
}

function GuidePanel({ title, items }: { title: string; items: string[] }) {
  return <div className="mt-3 grid gap-4 md:grid-cols-2"><Panel className="p-5"><h2 className="font-black">{title}</h2><ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">{items.map((item) => <li key={item}>{item}</li>)}</ul></Panel><Panel className="p-5"><h2 className="font-black">Facilitator Tips</h2><ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600"><li>Set clear expectations at the start.</li><li>Time-box everything.</li><li>Work silently where possible to reduce groupthink.</li><li>Keep decisions visible.</li></ul></Panel></div>;
}

function DayResources({ day, openHmw }: { day: SprintDay; openHmw: () => void }) {
  const cards = day.id === "day1" ? [["Problem Mapping Template", "Visual template for mapping user journeys and identifying pain points.", "Download Template"], ["Expert Interview Script", "Sample questions and structure for conducting expert interviews.", "Download Script"], ["How Might We Generator", "Interactive tool to help generate better How Might We questions.", "Open Tool"], ["Voting & Decision Framework", "Structured approach for making decisions and selecting targets.", "Download Framework"]] : [[`${day.label} Worksheet`, `Support template for ${day.title}.`, "Download Template"], [day.guideLabel, `Practical support for running ${day.label}.`, "View Guide"], ["Decision Log", "Capture key decisions and outputs.", "Open Log"], ["Facilitator Checklist", "Keep the session on track.", "View Checklist"]];
  return <div className="mt-3 grid gap-4 md:grid-cols-2">{cards.map(([title, desc, action]) => <Panel key={title} className="p-5"><h2 className="flex items-center gap-2 font-black"><BookOpen className="h-4 w-4" /> {title}</h2><p className="mt-7 text-sm leading-6 text-slate-500">{desc}</p><Button variant="secondary" className="mt-4 w-full" onClick={title.includes("How Might") ? openHmw : undefined}>{action}</Button></Panel>)}</div>;
}

function TimerPage({ setPage }: { setPage: (page: Page) => void }) {
  const [minutes, setMinutes] = useState(5);
  return <main className="mx-auto max-w-[1280px] px-6 py-8"><Button variant="secondary" onClick={() => setPage("dashboard")}><ArrowLeft className="h-4 w-4" /> Back</Button><h1 className="mt-6 text-3xl font-black">Activity Timer</h1><p className="mt-1 text-slate-500">Time-box your design sprint activities for maximum effectiveness</p><Panel className="mt-6 p-6 text-center"><h2 className="text-left font-black">Activity Timer</h2><p className="text-left text-sm text-slate-500">Activity</p><div className="mt-8 font-mono text-6xl font-black tabular-nums">{String(minutes).padStart(2, "0")}:00</div><div className="mt-4 flex items-center justify-center gap-3"><Button variant="secondary" onClick={() => setMinutes(Math.max(1, minutes - 1))}><Minus className="h-4 w-4" /></Button><span className="text-sm text-slate-500">Minutes</span><Button variant="secondary" onClick={() => setMinutes(minutes + 1)}><Plus className="h-4 w-4" /></Button></div><div className="mt-4 flex flex-wrap justify-center gap-2">{[1, 3, 5, 8, 15, 30].map((m) => <Button key={m} variant="secondary" onClick={() => setMinutes(m)}>{m} min</Button>)}</div><div className="mt-4 flex justify-center gap-2"><Button><Play className="h-4 w-4" /> Start</Button><Button variant="secondary"><RefreshCw className="h-4 w-4" /> Reset</Button></div></Panel></main>;
}

function ResourcesPage({ setPage }: { setPage: (page: Page) => void }) {
  const [tab, setTab] = useState<ResourceTab>("templates");
  return <main className="mx-auto max-w-[1280px] px-6 py-8"><Button variant="secondary" onClick={() => setPage("dashboard")}><ArrowLeft className="h-4 w-4" /> Back</Button><div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h1 className="text-3xl font-black">Resource Library</h1><p className="mt-1 text-slate-500">Complete collection of templates, worksheets, and facilitator guidance for successful design sprints</p></div><Button variant="secondary"><Download className="h-4 w-4" /> Download All Templates</Button></div><div className="mt-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1"><button onClick={() => setTab("templates")} className={cx("rounded-xl py-2 text-sm font-black", tab === "templates" && "bg-white shadow-sm")}>Templates & Tools</button><button onClick={() => setTab("facilitation")} className={cx("rounded-xl py-2 text-sm font-black", tab === "facilitation" && "bg-white shadow-sm")}>Facilitator Guidance</button></div>{tab === "templates" ? <div className="mt-3 grid gap-4 md:grid-cols-2">{resources.map((r, i) => <Panel key={r} className="p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-black">{r}</h2><span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">{i < 4 ? "Day 1" : "Day 4"}</span></div><p className="mt-3 text-sm leading-6 text-slate-500">Practical guide with timings, team roles, facilitation prompts, and outputs.</p><Button variant="secondary" className="mt-4 w-full"><Eye className="h-4 w-4" /> View guide</Button></Panel>)}</div> : <GuidePanel title="General Facilitation" items={["Set clear expectations", "Use the parking lot", "Time-box everything", "Work silently when needed", "Keep energy high"]} />}</main>;
}

function HmwModal({ open, onClose, state, setState }: { open: boolean; onClose: () => void; state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>> }) {
  const [tab, setTab] = useState<HmwTab>("generate");
  const [problem, setProblem] = useState("users struggle to find relevant information quickly on our website");
  const [targetUser, setTargetUser] = useState("busy parents");
  const [context, setContext] = useState("during onboarding, time constraints");
  if (!open) return null;
  const generate = () => { const qs = [`How might we help ${targetUser} achieve their goals despite ${problem}?`, `How might we empower ${targetUser} to feel more confident when navigating this process?`, `How might we reduce the frustration ${targetUser} feel when ${problem}?`, `How might we make ${targetUser} feel more supported throughout ${context}?`]; setState((s) => ({ ...s, hmws: [...new Set([...s.hmws, ...qs])] })); setTab("saved"); };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b p-5"><div><h2 className="flex items-center gap-2 text-xl font-black"><HelpCircle className="h-5 w-5" /> How Might We Generator</h2><p className="text-sm text-slate-500">Interactive tool to help generate better How Might We questions.</p></div><Button variant="ghost" onClick={onClose}><X className="h-4 w-4" /> Close</Button></div><div className="mx-5 mt-4 grid grid-cols-4 rounded-2xl bg-slate-100 p-1">{(["generate", "saved", "templates", "guide"] as HmwTab[]).map((t) => <button key={t} onClick={() => setTab(t)} className={cx("rounded-xl py-2 text-sm font-black capitalize", tab === t && "bg-white shadow-sm")}>{t}</button>)}</div><div className="max-h-[65vh] overflow-y-auto p-5">{tab === "generate" && <Panel className="p-5"><h3 className="text-lg font-black">Problem Definition</h3><label className="mt-6 block text-sm font-black">Problem or Challenge *</label><input value={problem} onChange={(e) => setProblem(e.target.value)} className="mt-2 w-full rounded-lg bg-slate-100 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950" /><label className="mt-4 block text-sm font-black">Target User</label><input value={targetUser} onChange={(e) => setTargetUser(e.target.value)} className="mt-2 w-full rounded-lg bg-slate-100 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950" /><label className="mt-4 block text-sm font-black">Context</label><input value={context} onChange={(e) => setContext(e.target.value)} className="mt-2 w-full rounded-lg bg-slate-100 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950" /><Button className="mt-4 w-full" onClick={generate}><Lightbulb className="h-4 w-4" /> Generate HMW Questions</Button></Panel>}{tab === "saved" && <Panel className="p-8 text-center">{state.hmws.length === 0 ? <><CheckCircle2 className="mx-auto h-14 w-14 text-slate-400" /><h3 className="mt-4 font-black">No Saved Questions Yet</h3><p className="mt-2 text-sm text-slate-500">Generate HMW questions and save your favourites.</p></> : <div className="space-y-2 text-left">{state.hmws.map((q) => <div key={q} className="flex items-center gap-3 rounded-lg bg-slate-100 p-3 text-sm"><span className="flex-1">{q}</span><Copy className="h-4 w-4" /></div>)}</div>}</Panel>}{tab === "templates" && <GuidePanel title="HMW Templates" items={["How might we help [users] achieve their goals despite [challenge]?", "How might we empower [users] to feel more confident?", "How might we reduce frustration when [problem] occurs?", "How might we make [process] feel more supportive?"]} />}{tab === "guide" && <GuidePanel title="HMW Question Quality Framework" items={["User-centred", "Actionable", "Broad enough to inspire options", "Specific enough to focus the team", "Positive framing", "Solution-neutral"]} />}</div></div></div>;
}

function HelperPanel({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  if (!open) return <button aria-label="Open facilitator helper" onClick={() => setOpen(true)} className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl"><Bot className="h-6 w-6" /></button>;
  return <aside className="fixed bottom-8 right-8 z-40 w-[360px] rounded-2xl border bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-4"><h2 className="flex items-center gap-2 font-black"><Bot className="h-5 w-5 text-blue-600" /> Facilitator Helper</h2><Button variant="ghost" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button></div><div className="space-y-3 p-4"><div className="rounded-xl bg-slate-100 p-3 text-sm leading-6">Hi! I’m your Facilitator Helper. I can help with timers, navigation, and design sprint questions.</div><div className="rounded-xl bg-yellow-100 p-3 text-sm leading-6 text-yellow-900">Say “Helper” followed by a command, or click the mic button to start listening.</div></div><div className="border-t p-4"><div className="mb-2 flex gap-2"><Button variant="secondary" className="px-3"><Mic className="h-4 w-4" /></Button><Button variant="secondary" className="px-3"><Clock className="h-4 w-4" /></Button><Button variant="secondary" className="px-3"><HelpCircle className="h-4 w-4" /></Button></div><div className="flex gap-2"><input className="min-w-0 flex-1 rounded-lg bg-slate-100 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-950" placeholder="Type a message or say 'Helper' + command..." /><Button className="px-3"><Send className="h-4 w-4" /></Button></div></div></aside>;
}

export default function DesignSprintFacilitatorApp() {
  const [page, setPage] = useState<Page>("dashboard");
  const [state, setState] = useState<AppState>({ currentDay: "day1", completed: [], notes: {}, hmws: [] });
  const [hmwOpen, setHmwOpen] = useState(false);
  const [helperOpen, setHelperOpen] = useState(false);
  const currentDay = useMemo(() => sprintDays.find((day) => day.id === page), [page]);
  const goTo = (nextPage: Page) => { setPage(nextPage); if (["day1", "day2", "day3", "day4"].includes(nextPage)) setState((s) => ({ ...s, currentDay: nextPage as DayId })); };
  return <div
  className="min-h-screen bg-white font-sans text-slate-950"
  style={{ fontFamily: "Roboto, Arial, Helvetica, sans-serif" }}
><a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">Skip to content</a><Header page={page} setPage={goTo} currentDay={state.currentDay} /><div id="main">{page === "dashboard" && <Dashboard state={state} setPage={goTo} openHmw={() => setHmwOpen(true)} />}{currentDay && <DayPage day={currentDay} state={state} setState={setState} setPage={goTo} openHmw={() => setHmwOpen(true)} />}{page === "timer" && <TimerPage setPage={goTo} />}{page === "resources" && <ResourcesPage setPage={goTo} />}</div><footer className="mt-16 border-t bg-slate-50 py-8 text-center text-sm text-slate-500"><p>Design Sprint Facilitator - Your complete guide to running successful 4-day design sprints</p><p className="mt-2">Built for design teams, product managers, and innovation facilitators</p></footer><HelperPanel open={helperOpen} setOpen={setHelperOpen} /><HmwModal open={hmwOpen} onClose={() => setHmwOpen(false)} state={state} setState={setState} /></div>;
}
