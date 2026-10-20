import {FileText,CalendarDays,BookOpen,Network} from 'lucide-react';

const nav=[['About','about'],['Membership','membership'],['Member Directory','memberDirectory'],['Leadership','leadership'],['Events','events'],['Publications','publications'],['Chapters','chapters'],['News','news'],['Projects','projects'],['Technical Divisions','technicalDivisions'],['Committees','committees'],['Contact','contact']]

const presidents=[]

const events=[]

const publications=['NI4E Technical Journal','Energy & Power Practice Notes','Electrical Safety Guidelines','Annual Institution Report']

const heroSlides=[
  {eyebrow:'ADVANCING ENGINEERING EXCELLENCE',title:'Engineering a stronger, more sustainable Nigeria.',text:'NI4E brings together professionals across energy, electrical and electronics engineering to advance knowledge, standards, innovation and national development.',label:'Professional community'},
  {eyebrow:'ENERGY • ELECTRICAL • ELECTRONICS',title:'Connecting engineering knowledge with national impact.',text:'A digital home for professional development, technical resources, collaboration, events and membership services.',label:'National network'},
  {eyebrow:'THE DIGITAL NI4E EXPERIENCE',title:'One platform for members, professionals and the Institution.',text:'Discover a connected experience for membership applications, events, publications, certificates, enquiries and future digital services.',label:'Digital membership'}
]

const institutionStats=[
  ['01','Connected platform','Public + member services'],
  ['04','Ordinary categories','Fellowship handled separately'],
  ['04','Connected areas','Website, membership, portal & admin'],
  ['24/7','Digital access','Information and member services']
]

const quickResources=[
  [FileText,'Membership Guide','Explore membership pathways and application requirements.','membership'],
  [CalendarDays,'Events Calendar','Discover conferences, workshops and professional forums.','events'],
  [BookOpen,'Technical Library','Browse publications, reports and professional resources.','publications'],
  [Network,'Chapter Network','Explore regional and professional chapter information.','chapters']
]

export { nav, presidents, events, publications, heroSlides, institutionStats, quickResources };
