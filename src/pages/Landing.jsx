// The public landing page. Nobody needs to be logged in to see it.
//
// Photos: all sourced from Pexels (pexels.com/license - free for commercial
// use, no attribution required) since no real photos of this specific
// school were available to use. Swap the URLs in PHOTOS below for the
// school's own photography whenever it's ready; nothing else needs to
// change. Keep using real photos of real people only with their consent.
//
// Design notes, so a future edit doesn't quietly drift into a generic
// template: this school is a real government school in Skardu, a valley
// in Gilgit-Baltistan known for glacial rivers and apricot orchards, open
// since 1974. The palette and the mountain-ridge motif come from that
// setting rather than from a generic "ed-tech SaaS" look, and the accent
// colour (gold) is used deliberately rather than smeared across every
// section. Motion is reserved for one orchestrated moment on load (the
// headline and ridge line settling into place) plus places where the page
// is responding to something the visitor does (opening the menu, switching
// a tab, expanding a question) - not a blanket fade-in on every section.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Menu, X, ArrowRight, FileEdit, Search, LogIn, BookOpen, Users, ShieldCheck,
  ClipboardList, Megaphone, Microscope, Landmark,
  MapPin, Phone, Mail, Clock, ChevronDown, Quote, GraduationCap, Sprout,
} from "lucide-react";
import { useAuth } from "../auth.jsx";
import { SCHOOL, Crest } from "../school.jsx";

const FOUNDED = 1974;
const AGE = new Date().getFullYear() - FOUNDED;

// One place to swap in the school's own photography later.
const PHOTOS = {
  hero: "https://images.pexels.com/photos/17913659/pexels-photo-17913659.jpeg?auto=compress&cs=tinysrgb&w=1400",
  classroom: "https://images.pexels.com/photos/12714642/pexels-photo-12714642.jpeg?auto=compress&cs=tinysrgb&w=1000",
  admissions: "https://images.pexels.com/photos/18627614/pexels-photo-18627614.jpeg?auto=compress&cs=tinysrgb&w=1000",
  ctaBg: "https://images.pexels.com/photos/27151258/pexels-photo-27151258.jpeg?auto=compress&cs=tinysrgb&w=1600",
  gallery: [
    { src: "https://images.pexels.com/photos/10638213/pexels-photo-10638213.jpeg?auto=compress&cs=tinysrgb&w=700", title: "Library", body: "Reading together, every grade has its own time." },
    { src: "https://images.pexels.com/photos/33992840/pexels-photo-33992840.jpeg?auto=compress&cs=tinysrgb&w=700", title: "Science & computer lab", body: "Hands-on practicals from Middle onward." },
    { src: "https://images.pexels.com/photos/12714648/pexels-photo-12714648.jpeg?auto=compress&cs=tinysrgb&w=700", title: "Playground", body: "Games after the last bell, most afternoons." },
    { src: "https://images.pexels.com/photos/12506795/pexels-photo-12506795.jpeg?auto=compress&cs=tinysrgb&w=700", title: "Morning assembly", body: "The whole school gathers here before class." },
    { src: "https://images.pexels.com/photos/12714645/pexels-photo-12714645.jpeg?auto=compress&cs=tinysrgb&w=700", title: "Student life", body: "Friendships that last well past Class 10." },
    { src: "https://images.pexels.com/photos/5539290/pexels-photo-5539290.jpeg?auto=compress&cs=tinysrgb&w=700", title: "Computer room", body: "Typing and basic computing from Class 6 onward." },
  ],
};

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="bg-paper text-ink">
      <Navbar user={user} />
      <Hero user={user} />
      <MilestoneStrip />
      <WhyUs />
      <Programs />
      <CampusLife />
      <Testimonials />
      <AdmissionsProcess />
      <Faq />
      <CtaBand />
      <Footer />
    </div>
  );
}

// ------------------------------------------------------------------
// NAVBAR
// ------------------------------------------------------------------
const NAV_LINKS = [
  { href: "#why-us", label: "Why us" },
  { href: "#programs", label: "Programs" },
  { href: "#campus", label: "Campus life" },
  { href: "#admissions", label: "Admissions" },
  { href: "#faq", label: "Questions" },
];

function Navbar({ user }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(function () {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener("scroll", onScroll);
    return function () { window.removeEventListener("scroll", onScroll); };
  }, []);

  return (
    <header className={"sticky top-0 z-40 transition-shadow duration-300 bg-valley " + (scrolled ? "shadow-lg" : "")}>
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5 text-white">
          <Crest className="w-8 h-8" />
          <span className="font-display font-semibold text-lg leading-tight">{SCHOOL.shortName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-white/70">
          {NAV_LINKS.map(function (l) {
            return <a key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</a>;
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/check" className="text-sm text-white/70 hover:text-white transition-colors">Check result</Link>
          <Link
            to={user ? "/" + user.role : "/login"}
            className="bg-gold text-valley px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all inline-flex items-center gap-1.5"
          >
            {user ? "My dashboard" : "Sign in"} <LogIn size={14} />
          </Link>
        </div>

        <button onClick={function () { setOpen(!open); }} className="md:hidden text-white w-9 h-9 flex items-center justify-center" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="md:hidden overflow-hidden bg-valley border-t border-white/10"
      >
        <div className="px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map(function (l) {
            return (
              <a key={l.href} href={l.href} onClick={function () { setOpen(false); }} className="text-white/80 hover:text-white py-2.5 text-sm border-b border-white/10">
                {l.label}
              </a>
            );
          })}
          <Link to="/check" onClick={function () { setOpen(false); }} className="text-white/80 py-2.5 text-sm">Check result</Link>
          <Link to={user ? "/" + user.role : "/login"} className="bg-gold text-valley px-4 py-2.5 rounded-lg text-sm font-semibold text-center mt-2">
            {user ? "My dashboard" : "Sign in"}
          </Link>
        </div>
      </motion.div>
    </header>
  );
}

// ------------------------------------------------------------------
// HERO — a real photo of the valley, a headline that settles in line by
// line, and a floating stat card over the photo. The one orchestrated
// motion moment on the page.
// ------------------------------------------------------------------
function Hero({ user }) {
  const reduceMotion = useReducedMotion();
  const headline = ["Learning that", "grows with", "this valley."];

  return (
    <section className="relative bg-valley text-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-16 sm:pt-16 sm:pb-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-gold text-sm font-medium mb-4"
            >
              {SCHOOL.city} · open since {FOUNDED}
            </motion.p>

            <h1 className="font-display font-medium text-[2.5rem] sm:text-5xl leading-[1.08] tracking-tight">
              {headline.map(function (line, i) {
                return (
                  <motion.span
                    key={line}
                    initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className="block"
                  >
                    {line}
                  </motion.span>
                );
              })}
            </h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-white/70 text-lg mt-6 max-w-md leading-relaxed"
            >
              {SCHOOL.name} teaches {SCHOOL.classesRange.toLowerCase()}, in classrooms most of our
              teachers once sat in themselves. Apply online, then follow attendance, results and
              fees from one place, on any phone.
            </motion.p>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="flex flex-wrap gap-3 mt-8"
            >
              <Link to="/apply" className="bg-gold text-valley px-5 py-3 rounded-lg font-semibold hover:brightness-110 transition-all inline-flex items-center gap-2">
                Apply for admission <ArrowRight size={16} />
              </Link>
              <Link to={user ? "/" + user.role : "/login"} className="border border-white/25 px-5 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                {user ? "My dashboard" : "Parent & student sign in"}
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-[4/5] sm:aspect-[5/4]">
              <img
                src={PHOTOS.hero}
                alt="A village in a mountain valley in Gilgit-Baltistan, similar to the one the school serves"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute -bottom-5 -left-5 sm:-left-8 bg-white text-valley rounded-xl shadow-xl px-5 py-4 border border-slate-100 max-w-[12rem]">
              <p className="font-display text-2xl text-gold leading-none">{AGE}+</p>
              <p className="text-xs text-slate-500 mt-1">years teaching families in this valley</p>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
      >
        <RidgeLine />
      </motion.div>
    </section>
  );
}

// A simple layered mountain skyline, a graphic echo of the photo above it.
function RidgeLine() {
  return (
    <svg viewBox="0 0 1200 120" className="w-full h-auto block" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,120 L0,84 L150,57 L260,78 L400,33 L520,66 L640,42 L760,75 L900,36 L1040,69 L1200,51 L1200,120 Z" fill="#28414D" />
      <path d="M0,120 L0,99 L120,72 L240,93 L380,54 L500,84 L660,63 L820,90 L960,60 L1090,87 L1200,72 L1200,120 Z" fill="#1C2E37" />
    </svg>
  );
}

// ------------------------------------------------------------------
// MILESTONE STRIP — a count-up moment when it first scrolls into view.
// ------------------------------------------------------------------
function MilestoneStrip() {
  return (
    <section className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <Milestone target={AGE} suffix=" yrs" label="Serving this valley" />
        <Milestone target={1200} suffix="+" label="Students this year" />
        <Milestone target={60} suffix="+" label="Teachers & staff" />
        <Milestone target={11} label="Grade levels, Nursery to 10" />
      </div>
    </section>
  );
}

function Milestone({ target, suffix = "", label }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(
    function () {
      const el = ref.current;
      if (!el) return;
      if (reduceMotion) { setValue(target); return; }

      const observer = new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting && !started.current) {
            started.current = true;
            const duration = 1200;
            const start = performance.now();

            function tick(now) {
              const progress = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - progress, 3);
              setValue(Math.round(target * eased));
              if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          }
        },
        { threshold: 0.4 }
      );

      observer.observe(el);
      return function () { observer.disconnect(); };
    },
    [target, reduceMotion]
  );

  return (
    <div ref={ref}>
      <p className="font-display text-3xl sm:text-4xl text-valley">{value.toLocaleString()}{suffix}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}

// ------------------------------------------------------------------
// WHY US — a real classroom photo anchoring a divided list, not a grid
// of identical shadowed cards.
// ------------------------------------------------------------------
const REASONS = [
  { icon: Landmark, title: "Public education, genuinely open to everyone", body: "A government school with fees any family in the valley can manage, and a gate that's open to every child who applies." },
  { icon: Users, title: "Teachers who stay", body: "Many of our teachers have taught here for decades. They know the families, the siblings, and often the parents' own school days." },
  { icon: BookOpen, title: "Sections kept small", body: "Every class is split into sections so no student is just a name on a long list - teachers notice when someone's struggling." },
  { icon: ShieldCheck, title: "One gated campus", body: "All grades share a single, walled campus within walking distance of most neighbourhoods in Skardu." },
  { icon: ClipboardList, title: "Records parents can actually see", body: "Attendance, marks and fee slips are visible to parents as they happen, not only at the end of term." },
  { icon: Megaphone, title: "A school that answers to the community", body: "An open office, a public notice board, and staff who are reachable - this school belongs to the valley it teaches." },
];

function WhyUs() {
  return (
    <section id="why-us" className="max-w-6xl mx-auto px-4 py-20">
      <div className="grid lg:grid-cols-5 gap-12 items-start">
        <div className="lg:col-span-2 lg:sticky lg:top-24">
          <p className="text-gold text-sm font-medium mb-3">Why families choose us</p>
          <h2 className="font-display text-3xl sm:text-4xl text-valley leading-tight mb-6">
           Lunar Public School  built around knowing every child by name.
          </h2>
          <div className="rounded-2xl overflow-hidden shadow-card aspect-[4/3]">
            <img
              src={PHOTOS.classroom}
              alt="A teacher and students in a classroom lesson"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-3 divide-y divide-slate-200 border-t border-b border-slate-200">
          {REASONS.map(function (r) {
            const Icon = r.icon;
            return (
              <div key={r.title} className="py-6">
                <div className="flex items-center gap-2.5 mb-2">
                  <Icon size={19} className="text-glacier shrink-0" />
                  <h3 className="font-display text-lg text-valley leading-snug">{r.title}</h3>
                </div>
                <p className="text-slate-600 leading-relaxed">{r.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// PROGRAMS — genuinely a sequence, so an ascending numbered path is the
// right treatment, not decoration.
// ------------------------------------------------------------------
const PROGRAMS = [
  { stage: "Nursery & Kindergarten", ages: "Ages 3–5", icon: Sprout, body: "First letters, first numbers, and a room full of songs. The goal at this stage is simple: make school a place children want to come back to." },
  { stage: "Primary — Class 1 to 5", ages: "Ages 6–10", icon: BookOpen, body: "Reading, writing and arithmetic, taught alongside Urdu, English and Islamiyat together, building the habits the rest of school depends on." },
  { stage: "Middle — Class 6 to 8", ages: "Ages 11–13", icon: Microscope, body: "Science and mathematics become their own subjects, each with a subject teacher, as students start choosing what they're good at." },
  { stage: "Secondary — Class 9 & 10", ages: "Ages 14–16", icon: GraduationCap, body: "Focused preparation for the matriculation board exams, with results tracked all year, not only revealed at the end of it." },
];

function Programs() {
  return (
    <section id="programs" className="bg-valley text-white py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-xl mb-14">
          <p className="text-gold text-sm font-medium mb-3">Programs</p>
          <h2 className="font-display text-3xl sm:text-4xl leading-tight">Four stages, one school, all on the same campus.</h2>
        </div>

        <div className="relative">
          <div className="hidden sm:block absolute left-[27px] top-4 bottom-4 w-px bg-white/15" aria-hidden="true" />
          <ol className="space-y-10">
            {PROGRAMS.map(function (p) {
              const Icon = p.icon;
              return (
                <li key={p.stage} className="relative sm:pl-20">
                  <span className="hidden sm:flex absolute left-0 top-0 w-14 h-14 rounded-full bg-valley border border-white/20 items-center justify-center">
                    <Icon size={22} className="text-gold" />
                  </span>
                  <div className="flex sm:hidden items-center gap-3 mb-2">
                    <Icon size={20} className="text-gold" />
                    <span className="text-xs text-white/50">{p.ages}</span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-display text-xl sm:text-2xl">{p.stage}</h3>
                    <span className="hidden sm:inline text-xs text-white/50">{p.ages}</span>
                  </div>
                  <p className="text-white/70 mt-2 max-w-xl leading-relaxed">{p.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// CAMPUS LIFE — a real photo gallery, captions revealed over each tile.
// ------------------------------------------------------------------
function CampusLife() {
  return (
    <section id="campus" className="max-w-6xl mx-auto px-4 py-20">
      <div className="max-w-xl mb-10">
        <p className="text-gold text-sm font-medium mb-3">Campus life</p>
        <h2 className="font-display text-3xl sm:text-4xl text-valley leading-tight">
          One campus, room enough for everything a school day needs.
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PHOTOS.gallery.map(function (g) {
          return (
            <div key={g.title} className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-card">
              <img
                src={g.src}
                alt={g.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-valley/90 via-valley/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-display text-lg text-white">{g.title}</h3>
                <p className="text-xs text-white/75 mt-0.5">{g.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// TESTIMONIALS — pinned notes on a board. Illustrative quotes, not tied
// to real photos of anyone, since no real photo should be captioned with
// an invented name.
// ------------------------------------------------------------------
const NOTES = [
  { quote: "My daughter walks to school on her own now, and I still know exactly how her day went - attendance and homework both, right on my phone.", name: "Parveen Akhtar", role: "Parent, Class 4", tilt: "-rotate-2" },
  { quote: "Our maths teacher stays back after the bell if anyone's still stuck on something. That's the whole school, really.", name: "Hassan Ali", role: "Student, Class 9", tilt: "rotate-1" },
  { quote: "Thirty years teaching in this valley, and I still learn a new family's name every admission season.", name: "Fatima Baig", role: "Class teacher, Class 6", tilt: "-rotate-1" },
];

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
}

function Testimonials() {
  return (
    <section className="bg-apricot/25 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-xl mb-14">
          <p className="text-gold text-sm font-medium mb-3">From the school community</p>
          <h2 className="font-display text-3xl sm:text-4xl text-valley leading-tight">What parents, students and teachers say.</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {NOTES.map(function (n) {
            return (
              <div key={n.name} className={"bg-white rounded-sm shadow-card p-6 " + n.tilt + " hover:rotate-0 transition-transform duration-300"}>
                <Quote size={22} className="text-gold mb-3" />
                <p className="text-valley leading-relaxed">{n.quote}</p>
                <div className="flex items-center gap-3 mt-5">
                  <span className="w-9 h-9 rounded-full bg-glacier/15 text-glacier flex items-center justify-center text-xs font-bold shrink-0">
                    {initials(n.name)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{n.name}</p>
                    <p className="text-xs text-slate-500">{n.role}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// ADMISSIONS PROCESS — a real sequence, with a photo giving it a face.
// ------------------------------------------------------------------
const STEPS = [
  { title: "Send the form", body: "Fill it in online, in a few minutes. Keep the printed copy - it carries your form number." },
  { title: "We review it", body: "The office checks the details and whatever document you attached." },
  { title: "Check the result", body: "Search your form number on the result page to see the decision." },
  { title: "Collect logins", body: "If accepted, bring the printed form to the office to collect the student and parent logins." },
];

function AdmissionsProcess() {
  return (
    <section id="admissions" className="max-w-6xl mx-auto px-4 py-20">
      <div className="grid lg:grid-cols-5 gap-12 items-center">
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden shadow-card aspect-[4/5] mb-6">
            <img src={PHOTOS.admissions} alt="Two students in school uniform, smiling" className="w-full h-full object-cover" />
          </div>
          <p className="text-gold text-sm font-medium mb-3">Admissions</p>
          <h2 className="font-display text-3xl sm:text-4xl text-valley leading-tight mb-5">Four steps, from form to first day.</h2>
          <Link to="/apply" className="inline-flex items-center gap-2 bg-valley text-white px-5 py-3 rounded-lg font-semibold hover:bg-valley/90 transition-colors">
            Start an application <ArrowRight size={16} />
          </Link>
        </div>

        <ol className="lg:col-span-3 space-y-0">
          {STEPS.map(function (s, i) {
            return (
              <li key={s.title} className="flex gap-5 py-5 border-b border-slate-200 last:border-0">
                <span className="font-display text-2xl text-slate-300 w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-semibold text-ink">{s.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{s.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// FAQ — expands on click.
// ------------------------------------------------------------------
const QUESTIONS = [
  { q: "What documents do I need to apply?", a: "A birth certificate or the child's last school result, if they've attended school before. You can attach it to the online form, or bring it to the office later." },
  { q: "Is there an admission test?", a: "Not for Nursery or Class 1 - just a short conversation with the child. From Class 2 onward, we check basic reading and number skills for the class being applied to." },
  { q: "What are the school fees?", a: "This is a government school, so fees are kept low and are the same for every family. Once enrolled, monthly fee slips appear in the parent's own account." },
  { q: "What are the school timings?", a: SCHOOL.hours + "." },
  { q: "How do I find out if my child was accepted?", a: "Search your form number on the result page. It also tells you if the application is still being reviewed, or wasn't accepted." },
  { q: "I've lost my password - what do I do?", a: "Ask the school office. They will check it is really you and give you a new temporary password, which you can change after you sign in." },
];

function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="bg-white border-t border-slate-200 py-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-10">
          <p className="text-gold text-sm font-medium mb-3">Questions families ask</p>
          <h2 className="font-display text-3xl sm:text-4xl text-valley leading-tight">A few things worth knowing before you apply.</h2>
        </div>

        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
          {QUESTIONS.map(function (item, i) {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button onClick={function () { setOpen(isOpen ? -1 : i); }} className="w-full flex items-center justify-between gap-4 py-5 text-left" aria-expanded={isOpen}>
                  <span className="font-medium text-ink">{item.q}</span>
                  <ChevronDown size={18} className={"text-slate-400 shrink-0 transition-transform duration-300 " + (isOpen ? "rotate-180" : "")} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="text-slate-600 leading-relaxed pb-5 pr-8">{item.a}</p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// CTA BAND — a real photo background, dark overlay for legibility.
// ------------------------------------------------------------------
function CtaBand() {
  return (
    <section className="relative text-white">
      <img src={PHOTOS.ctaBg} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-valley/85" />
      <div className="relative max-w-6xl mx-auto px-4 py-16 flex flex-wrap items-center justify-between gap-8">
        <div className="max-w-md">
          <h2 className="font-display text-3xl leading-tight">Ready to enrol your child?</h2>
          <p className="text-white/70 mt-2">Applications are reviewed by hand, usually within a few days.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/apply" className="bg-gold text-valley px-5 py-3 rounded-lg font-semibold hover:brightness-110 transition-all inline-flex items-center gap-2">
            Apply for admission <ArrowRight size={16} />
          </Link>
          <Link to="/check" className="border border-white/25 px-5 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors inline-flex items-center gap-2">
            <Search size={16} /> Check a result
          </Link>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// FOOTER
// ------------------------------------------------------------------
function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 text-valley mb-3">
            <Crest className="w-7 h-7" />
            <span className="font-display font-semibold">{SCHOOL.shortName}</span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">{SCHOOL.tagline}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink mb-3">Visit or apply</p>
          <FooterLink to="/apply" label="Admission form" icon={FileEdit} />
          <FooterLink to="/check" label="Check a result" icon={Search} />
          <FooterLink to="/login" label="Sign in" icon={LogIn} />
          <FooterLink to="/notices" label="Notice board" icon={Megaphone} />
        </div>

        <div>
          <p className="text-sm font-semibold text-ink mb-3">Programs</p>
          <p className="text-sm text-slate-500 py-1.5">Nursery & Kindergarten</p>
          <p className="text-sm text-slate-500 py-1.5">Primary — Class 1 to 5</p>
          <p className="text-sm text-slate-500 py-1.5">Middle — Class 6 to 8</p>
          <p className="text-sm text-slate-500 py-1.5">Secondary — Class 9 & 10</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink mb-3">Contact</p>
          <p className="text-sm text-slate-500 flex items-start gap-2 py-1.5"><MapPin size={15} className="mt-0.5 shrink-0" /> {SCHOOL.address}</p>
          <p className="text-sm text-slate-500 flex items-center gap-2 py-1.5"><Phone size={15} className="shrink-0" /> {SCHOOL.phone}</p>
          <p className="text-sm text-slate-500 flex items-center gap-2 py-1.5"><Mail size={15} className="shrink-0" /> {SCHOOL.email}</p>
          <p className="text-sm text-slate-500 flex items-center gap-2 py-1.5"><Clock size={15} className="shrink-0" /> {SCHOOL.hours}</p>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <p className="max-w-6xl mx-auto px-4 py-5 text-xs text-slate-400">
          {SCHOOL.name}, {SCHOOL.city}. Government school management system.
        </p>
      </div>
    </footer>
  );
}

function FooterLink({ to, label, icon: Icon }) {
  return (
    <Link to={to} className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal py-1.5 transition-colors">
      <Icon size={15} /> {label}
    </Link>
  );
}
