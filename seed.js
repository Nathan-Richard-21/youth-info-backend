const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Import models
const User = require('./models/User');
const Opportunity = require('./models/Opportunity');
const ForumPost = require('./models/ForumPost');
const ForumComment = require('./models/ForumComment');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Error: MONGO_URI environment variable is not set');
  console.error('Please set MONGO_URI in your .env file');
  process.exit(1);
}

// Demo opportunities data - Real opportunities for South African youth
const demoOpportunities = [
  // LEARNERSHIPS
  {
    title: 'UIF LAP Contact Centre Learnership 2025/2026',
    description: '12-month contact centre learnership programme funded by the Unemployment Insurance Fund Labour Activation Programme. This comprehensive training will equip you with essential customer service, communication, and contact centre management skills. Ideal for young people looking to start a career in the customer service industry. Gain practical experience while earning a stipend and receive a nationally recognized qualification upon completion.',
    category: 'learnership',
    subcategory: 'Contact Centre',
    organization: 'Ubuntu Institute',
    contactEmail: 'info@ubuntuinstitute.co.za',
    website: 'https://forms.zohopublic.com/ubuntuinstitute1/form/CONTACTCENTREUIFLEARNERSHIPAPPLICATIONS/formperma/pllkJ3qogOC5JwsrkkYoAMFLfOqfzwUtz_fVEeS5jN0',
    location: 'National',
    eligibility: 'South African citizens aged 18-35, Matric certificate',
    requirements: ['Grade 12 certificate', 'South African ID', 'Good communication skills', 'Computer literacy'],
    startDate: '2026-01-15',
    closingDate: '2026-12-31',
    imageUrl: 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=800&q=80',
    tags: ['learnership', 'contact-centre', 'customer-service', 'uif', 'national'],
    featured: true,
    status: 'approved',
    urgent: true
  },
  {
    title: 'UIF LAP Wholesale & Retail Learnership 2025/2026',
    description: '12-month wholesale and retail learnership offering hands-on experience in the retail sector. Learn about stock management, customer service, sales techniques, merchandising, and retail operations. This UIF-funded programme provides both theoretical knowledge and practical workplace experience, preparing you for a successful career in retail management.',
    category: 'learnership',
    subcategory: 'Retail',
    organization: 'Ubuntu Institute',
    contactEmail: 'info@ubuntuinstitute.co.za',
    website: 'https://forms.zohopublic.com/ubuntuinstitute1/form/WHOLESALERETAILUIFLEARNERSHIPAPPLICATIONS/formperma/BODw3M-q_7xttoIRWHfTKvwUSX1_uZeHRrrCmL70sjM',
    location: 'National',
    eligibility: 'South African citizens aged 18-35, Grade 12',
    requirements: ['Matric certificate', 'SA ID', 'Interest in retail sector', 'Basic numeracy skills'],
    startDate: '2026-01-15',
    closingDate: '2026-12-31',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
    tags: ['learnership', 'retail', 'wholesale', 'uif', 'sales'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'UIF LAP Electronics Learnership 2025/2026',
    description: '12-month electronics learnership programme providing comprehensive training in electronics installation, maintenance, and repair. Learn about electrical systems, electronic components, circuit design, troubleshooting, and safety procedures. This UIF-funded opportunity includes theoretical training at an accredited institution and practical workplace experience.',
    category: 'learnership',
    subcategory: 'Technical',
    organization: 'Ubuntu Institute',
    contactEmail: 'info@ubuntuinstitute.co.za',
    website: 'https://forms.zohopublic.com/ubuntuinstitute1/form/ELECTRONICSUIFLEARNERSHIPAPPLICATIONS/formperma/61ZFAecqsI2OfNGL2zAwhBcCvD3n383lTBqTdRWJQNg',
    location: 'National',
    eligibility: 'South African citizens aged 18-35, Matric with Maths and Science',
    requirements: ['Grade 12 with Mathematics and Physical Science', 'SA ID', 'Technical aptitude', 'Problem-solving skills'],
    startDate: '2026-01-15',
    closingDate: '2026-12-31',
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80',
    tags: ['learnership', 'electronics', 'technical', 'uif', 'engineering'],
    status: 'approved'
  },
  {
    title: 'KVR Training Academy 2026 Learnership',
    description: '12-month comprehensive learnership programme offered by KVR Training Academy. This structured programme combines theoretical learning with practical workplace experience across various fields. KVR Training Academy is committed to developing young talent and providing pathways to sustainable employment. Learners receive mentorship, industry exposure, and a nationally recognized qualification.',
    category: 'learnership',
    subcategory: 'Multi-sector',
    organization: 'KVR Training Academy',
    contactEmail: 'info@kvrtraining.co.za',
    website: 'https://www.kvrlearner-recruitment.online/faq/',
    location: 'National',
    eligibility: 'South African youth aged 18-35, Matric certificate',
    requirements: ['Grade 12 certificate', 'SA ID', 'Proof of residence', 'Motivation letter'],
    startDate: '2026-01-31',
    closingDate: '2026-01-20',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
    tags: ['learnership', 'training', 'multi-sector', 'youth-development'],
    status: 'approved'
  },
  {
    title: 'Eastern Cape ECD Learnership 2025',
    description: '12-month Early Childhood Development learnership specifically for candidates in the Eastern Cape. This ETDP SETA-accredited programme will equip you with skills to work in crèches, pre-schools, and early learning centers. Learn about child development, nutrition, play-based learning, and creating safe learning environments. Perfect for those passionate about nurturing young minds and building a career in early childhood education.',
    category: 'learnership',
    subcategory: 'Education',
    organization: 'ETDP SETA',
    contactEmail: 'KhanyisileH@etdpseta.org.za',
    website: 'mailto:KhanyisileH@etdpseta.org.za',
    location: 'Eastern Cape',
    eligibility: 'Eastern Cape residents aged 18-35, Grade 12',
    requirements: ['Matric certificate', 'SA ID', 'Love for working with children', 'Criminal clearance certificate'],
    startDate: '2026-03-01',
    closingDate: '2026-02-07',
    imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80',
    tags: ['learnership', 'ecd', 'education', 'eastern-cape', 'childcare'],
    status: 'approved',
    urgent: true
  },

  // BURSARIES
  {
    title: 'NSFAS Bursary 2026 - University & TVET College Funding',
    description: 'The National Student Financial Aid Scheme (NSFAS) provides comprehensive funding for South African students from low-income households. This bursary covers tuition fees, accommodation, transport, meals, and learning materials for students at public universities and TVET colleges. NSFAS is committed to ensuring that financial constraints do not prevent talented students from accessing higher education. Over 700,000 students benefit from NSFAS annually.',
    category: 'bursary',
    subcategory: 'Undergraduate',
    organization: 'NSFAS',
    contactEmail: 'info@nsfas.org.za',
    website: 'https://www.nsfas.org.za',
    location: 'National',
    eligibility: 'SA citizens, household income below R350,000 per year',
    requirements: ['South African ID', 'Matric certificate', 'Proof of household income', 'University/College acceptance letter'],
    closingDate: '2026-01-31',
    amount: 'Full funding package',
    fundingType: 'Full',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
    tags: ['bursary', 'undergraduate', 'nsfas', 'national', 'full-funding'],
    featured: true,
    status: 'approved',
    urgent: true
  },
  {
    title: 'Funza Lushaka Bursary Programme 2026',
    description: 'The Funza Lushaka Bursary Programme is a multi-year bursary for students studying towards becoming teachers. This Department of Basic Education initiative covers full tuition, accommodation, meals, books, and a living allowance. In return, bursary holders commit to teaching at a public school for the same number of years they received funding. Priority subjects include Mathematics, Science, Technology, and African languages.',
    category: 'bursary',
    subcategory: 'Teaching',
    organization: 'Department of Basic Education',
    contactEmail: 'FunzaLushaka@dbe.gov.za',
    website: 'https://www.dbe.gov.za',
    location: 'National',
    eligibility: 'SA citizens studying teaching qualifications, household income below R600,000',
    requirements: ['SA ID', 'Acceptance to teaching programme', 'Proof of household income', 'Good academic record'],
    closingDate: '2026-01-31',
    amount: 'R105,000 per year (full package)',
    fundingType: 'Full',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
    tags: ['bursary', 'teaching', 'education', 'funza-lushaka', 'full-funding'],
    featured: true,
    status: 'approved',
    urgent: true
  },
  {
    title: 'Sasol Bursary Programme 2026',
    description: 'Sasol offers comprehensive bursaries for South African students pursuing studies in Engineering, Science, Commerce, and IT. This prestigious programme covers tuition, accommodation, meals, textbooks, and a monthly allowance. Bursary holders receive mentorship, vacation work opportunities, and potential employment upon graduation. Sasol is committed to developing future leaders in technical and business fields.',
    category: 'bursary',
    subcategory: 'Undergraduate',
    organization: 'Sasol',
    contactEmail: 'bursaries@sasol.com',
    website: 'https://www.sasol.com/careers/bursaries',
    location: 'National',
    eligibility: 'SA citizens, excellent academic record (60%+ average)',
    requirements: ['Matric certificate with 60%+ average', 'Maths and Science 60%+', 'SA ID', 'University acceptance', 'Motivation letter'],
    closingDate: '2026-02-28',
    amount: 'Full funding + monthly allowance',
    fundingType: 'Full',
    imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80',
    tags: ['bursary', 'engineering', 'science', 'sasol', 'corporate'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'Standard Bank Tutuwa Bursary 2026',
    description: 'The Standard Bank Tutuwa Bursary supports talented students from disadvantaged backgrounds pursuing degrees in Commerce, IT, Engineering, and related fields. This comprehensive bursary covers all academic costs plus a living allowance. Bursary holders receive mentorship, leadership development, vacation work experience, and preferential consideration for employment. The programme focuses on developing future business and technology leaders.',
    category: 'bursary',
    subcategory: 'Undergraduate',
    organization: 'Standard Bank',
    contactEmail: 'tutuwabursary@standardbank.co.za',
    website: 'https://www.standardbank.com/bursaries',
    location: 'National',
    eligibility: 'SA citizens from disadvantaged backgrounds, strong academic performance',
    requirements: ['Grade 12 with 65%+ average', 'University acceptance letter', 'Proof of household income', 'SA ID', 'Motivation essay'],
    closingDate: '2026-02-15',
    amount: 'R80,000 - R120,000 per year',
    fundingType: 'Full',
    imageUrl: 'https://images.unsplash.com/photo-1554224311-beee2f770c4f?w=800&q=80',
    tags: ['bursary', 'commerce', 'banking', 'standard-bank', 'it'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'Department of Health Nursing Bursary 2026',
    description: 'The Department of Health offers bursaries for students pursuing nursing qualifications at public nursing colleges and universities. This bursary covers tuition, accommodation, uniforms, textbooks, and a monthly stipend. In return, graduates must work for the Department of Health for a specified period. This programme addresses the critical shortage of nurses in South Africa while providing students with quality education and guaranteed employment.',
    category: 'bursary',
    subcategory: 'Healthcare',
    organization: 'Department of Health',
    contactEmail: 'nursingbursaries@health.gov.za',
    website: 'https://www.health.gov.za',
    location: 'National',
    eligibility: 'SA citizens accepted to nursing programmes',
    requirements: ['Matric with Maths Literacy or Maths', 'Physical Science or Life Science', 'Acceptance to nursing college/university', 'Medical fitness certificate', 'SA ID'],
    closingDate: '2026-01-31',
    amount: 'Full funding + monthly stipend',
    fundingType: 'Full',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    tags: ['bursary', 'nursing', 'healthcare', 'government', 'medical'],
    status: 'approved'
  },
  {
    title: 'Eskom Bursary Programme 2026',
    description: 'Eskom provides bursaries for students pursuing qualifications in Engineering, Technology, Finance, and related fields. This programme covers tuition, accommodation, prescribed textbooks, and a monthly allowance. Bursary holders receive vacation work experience at Eskom facilities, mentorship from professionals, and potential employment opportunities. The programme aims to develop skilled professionals for the energy sector.',
    category: 'bursary',
    subcategory: 'Engineering',
    organization: 'Eskom',
    contactEmail: 'bursaries@eskom.co.za',
    website: 'https://www.eskom.co.za/careers/bursaries',
    location: 'National',
    eligibility: 'SA citizens with strong academic performance in Maths and Science',
    requirements: ['Matric with 60%+ in Maths and Science', 'University acceptance', 'SA ID', 'Medical certificate', 'Motivation letter'],
    closingDate: '2026-03-31',
    amount: 'R80,000 - R110,000 per year',
    fundingType: 'Full',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
    tags: ['bursary', 'engineering', 'eskom', 'energy', 'technical'],
    status: 'approved'
  },
  {
    title: 'Transnet Bursary Programme 2026',
    description: 'Transnet offers bursaries for students studying Engineering, Transport Economics, Logistics, Supply Chain, Finance, and IT. The bursary covers tuition, accommodation, meals, textbooks, and a monthly allowance. Students receive practical training at Transnet facilities during holidays and preferential employment consideration upon graduation. This programme supports the development of logistics and transport professionals.',
    category: 'bursary',
    subcategory: 'Engineering & Logistics',
    organization: 'Transnet',
    contactEmail: 'bursaries@transnet.net',
    website: 'https://www.transnet.net/careers/bursaries',
    location: 'National',
    eligibility: 'SA citizens with good academic record',
    requirements: ['Grade 12 with 60%+ average', 'Maths and Science 60%+', 'University acceptance', 'SA ID', 'Clean criminal record'],
    closingDate: '2026-03-15',
    amount: 'Full funding package',
    fundingType: 'Full',
    imageUrl: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&q=80',
    tags: ['bursary', 'engineering', 'logistics', 'transnet', 'transport'],
    status: 'approved'
  },
  {
    title: 'Allan Gray Orbis Foundation Scholarship 2026',
    description: 'The Allan Gray Orbis Foundation offers full scholarships to exceptional students who demonstrate academic excellence, leadership potential, and entrepreneurial thinking. This prestigious scholarship covers all study costs plus living expenses for undergraduate and postgraduate studies. Scholars join a lifelong fellowship programme with mentorship, networking, and business development support. The Foundation seeks future leaders who will make a positive impact on South Africa.',
    category: 'bursary',
    subcategory: 'All Fields',
    organization: 'Allan Gray Orbis Foundation',
    contactEmail: 'applications@allangrayorbis.org',
    website: 'https://www.allangrayorbis.org',
    location: 'National',
    eligibility: 'SA citizens with exceptional academic record and leadership potential',
    requirements: ['Outstanding Matric results', 'Leadership track record', 'Entrepreneurial mindset', 'Comprehensive application process', 'Multiple interviews'],
    closingDate: '2026-06-30',
    amount: 'Full scholarship + living expenses',
    fundingType: 'Full',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
    tags: ['bursary', 'scholarship', 'prestigious', 'leadership', 'allan-gray'],
    featured: true,
    status: 'approved'
  },

  // BUSINESS FUNDING - GRANTS
  {
    title: 'SEFA Funding - Small Enterprise Finance Agency',
    description: 'SEFA provides financial assistance to small businesses and SMMEs across South Africa. Access funding for assets, equipment, and working capital to grow your business. Loan amounts range from R500,000 to R15 million with flexible repayment terms. SEFA offers mentorship and business support to ensure your success. Ideal for established businesses looking to expand operations, purchase equipment, or improve cash flow.',
    category: 'business',
    subcategory: 'Loan',
    organization: 'SEFA (Small Enterprise Finance Agency)',
    contactEmail: 'info@sefa.org.za',
    website: 'https://www.sefa.org.za',
    location: 'National',
    eligibility: 'Registered SMMEs, Black-owned businesses prioritized',
    requirements: ['Business registration documents', 'Business plan', 'Financial statements (3 years)', 'Proof of BEE ownership', 'Collateral (depending on amount)'],
    closingDate: '2026-12-31',
    amount: 'R500,000 - R15 million',
    fundingType: 'Loan',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    tags: ['business', 'funding', 'sefa', 'loan', 'smme'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'SAB Foundation Funding for Entrepreneurs',
    description: 'The SAB Foundation supports innovative entrepreneurs with funding, mentorship, and business development support. This programme is designed for scalable businesses with high growth potential. Funding ranges from R300,000 to R1.3 million and includes access to expert mentors, networking opportunities, and ongoing business support. The Foundation focuses on sustainable businesses that create jobs and contribute to economic development.',
    category: 'business',
    subcategory: 'Grant',
    organization: 'SAB Foundation',
    contactEmail: 'info@sabfoundation.co.za',
    website: 'https://www.sabfoundation.co.za',
    location: 'National',
    eligibility: 'Innovative entrepreneurs with scalable business models',
    requirements: ['Comprehensive business plan', 'Financial projections', 'Proof of innovation', 'Management team CVs', 'Company registration'],
    closingDate: '2026-12-31',
    amount: 'R300,000 - R1.3 million',
    fundingType: 'Grant',
    imageUrl: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&q=80',
    tags: ['business', 'funding', 'sab', 'grant', 'innovation'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'NYDA Grant Programme - Youth Business Funding',
    title: 'NYDA Grant Programme - Youth Business Funding',
    description: 'The National Youth Development Agency offers grants between R2,000 and R200,000 to young entrepreneurs aged 18-35. Special funding up to R250,000 is available for agriculture and technology projects. This is non-refundable funding designed to help youth start or expand businesses. The programme includes business mentorship, training, and ongoing support services. Applications are processed continuously throughout the year.',
    category: 'business',
    subcategory: 'Grant',
    organization: 'NYDA',
    contactEmail: 'grants@nyda.gov.za',
    website: 'https://nydawebsite.azurewebsites.net',
    location: 'National',
    eligibility: 'South African youth aged 18-35 with viable business idea',
    requirements: ['Business plan', 'SA ID', 'Proof of address', 'Bank statements', 'Quotations for equipment/stock'],
    closingDate: '2026-12-31',
    amount: 'R2,000 - R250,000',
    fundingType: 'Grant',
    imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
    tags: ['business', 'grant', 'nyda', 'youth', 'entrepreneur'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'Google for Startups Black Founders Fund: Africa',
    description: 'Google for Startups offers equity-free funding and hands-on support to Black-led tech startups across Africa. This programme provides capital, mentorship from Google experts, and access to global networks and resources. Selected startups receive comprehensive support to scale their businesses, including technical assistance, product development guidance, and connections to potential investors and partners.',
    category: 'business',
    subcategory: 'Grant',
    organization: 'Google for Startups',
    contactEmail: 'blackfoundersfund@google.com',
    website: 'https://startup.google.com',
    location: 'Africa-wide (South Africa included)',
    eligibility: 'Black-led tech startups with scalable business models',
    requirements: ['Registered company', 'Black founder ownership', 'Tech-enabled business model', 'Pitch deck', 'Financial information'],
    closingDate: '2026-12-31',
    amount: 'Equity-free funding (amount varies)',
    fundingType: 'Grant',
    imageUrl: 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=800&q=80',
    tags: ['business', 'tech', 'startup', 'google', 'black-founders'],
    featured: true,
    status: 'approved'
  },

  // BUSINESS FUNDING - COMPETITIONS
  {
    title: 'Entrepreneurship Challenge Competition 2026',
    description: 'Annual entrepreneurship competition for young South Africans with innovative business ideas. Compete for R500,000 in prizes: 1st Place (R250,000), 2nd Place (R150,000), 3rd Place (R100,000). All top 20 finalists receive business mentorship, networking opportunities, and media exposure. The competition seeks scalable businesses that address social challenges, create jobs, and demonstrate innovation. Judging criteria: innovation (30%), market potential (25%), financial viability (25%), social impact (20%). Previous winners have successfully launched businesses in tech, agriculture, retail, and services sectors.',
    category: 'business',
    subcategory: 'Competition',
    organization: 'Entrepreneur Foundation SA',
    contactEmail: 'challenge@entrepreneurfoundation.co.za',
    website: 'https://www.entrepreneurchallenge.co.za',
    location: 'National',
    eligibility: 'SA citizens aged 18-35 with business concept or existing business under 2 years',
    requirements: ['Business pitch deck (10 slides max)', 'Executive summary (2 pages)', 'Financial projections', 'Video pitch (3 minutes)', 'SA ID'],
    closingDate: '2026-03-31',
    amount: 'R500,000 prize pool',
    fundingType: 'Competition',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    tags: ['business', 'competition', 'innovation', 'prize', 'entrepreneur'],
    featured: true,
    status: 'approved'
  },

  // BUSINESS FUNDING - BLENDED FINANCE & PROGRAMMES
  {
    title: 'Tourism Equity Fund (TEF)',
    description: 'The Tourism Equity Fund supports historically disadvantaged entrepreneurs in the tourism sector. Ideal for hotels, tour operators, travel agencies, and other tourism enterprises. TEF offers blended finance combining grants and loans to promote inclusive participation in South Africa\'s tourism industry. Funding supports business expansion, equipment purchase, and working capital needs.',
    category: 'business',
    subcategory: 'Blended Finance',
    organization: 'Department of Tourism',
    contactEmail: 'tef@tourism.gov.za',
    website: 'https://www.tourism.gov.za',
    location: 'National',
    eligibility: 'Historically disadvantaged entrepreneurs in tourism sector',
    requirements: ['Tourism business registration', 'BEE certificates', 'Business plan', 'Financial statements', 'Tourism license'],
    closingDate: '2026-12-31',
    amount: 'Blended finance (grants + loans)',
    fundingType: 'Blended',
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
    tags: ['business', 'tourism', 'tef', 'hospitality', 'travel'],
    status: 'approved'
  },
  {
    title: 'Isiqalo Youth Fund - Eastern Cape',
    description: 'The Isiqalo Youth Fund provides financial and non-financial support to legally registered youth-owned businesses in the Eastern Cape. Over R12 million has been distributed to 22 businesses as of 2025. The fund offers business development training, mentorship, and market linkage facilitation to ensure sustainable business growth. Priority given to businesses that create jobs and contribute to economic development in the province.',
    category: 'business',
    subcategory: 'Grant',
    organization: 'Eastern Cape Provincial Government',
    contactEmail: 'isiqalo@ecprov.gov.za',
    website: 'https://www.ecprov.gov.za',
    location: 'Eastern Cape',
    eligibility: 'Youth-owned businesses (18-35) registered in Eastern Cape',
    requirements: ['Business registration', 'SA ID', 'Proof of Eastern Cape residence', 'Business plan', 'Financial records'],
    closingDate: '2026-12-31',
    amount: 'Up to R500,000',
    fundingType: 'Grant',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    tags: ['business', 'grant', 'eastern-cape', 'youth', 'provincial'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'Youth Tech Entrepreneurship Programme - Eastern Cape',
    description: 'Year-long digital skills and entrepreneurship programme by Liquid Intelligent Technologies addressing youth unemployment through tech and entrepreneurship. The 2025 cohort graduated 20 entrepreneurs, with the winning startup receiving R100,000 seed funding plus 12 months of business support. The programme covers digital skills, business development, pitching, and access to markets and networks.',
    category: 'business',
    subcategory: 'Training & Funding',
    organization: 'Liquid Intelligent Technologies',
    contactEmail: 'techprogramme@liquid.tech',
    website: 'https://www.liquid.tech',
    location: 'Eastern Cape',
    eligibility: 'Young entrepreneurs (18-35) with tech business ideas',
    requirements: ['SA ID', 'Tech business concept', 'Application form', 'Pitch presentation'],
    closingDate: '2026-12-31',
    amount: 'R100,000 seed funding + 12-month support',
    fundingType: 'Grant',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    tags: ['business', 'tech', 'eastern-cape', 'training', 'entrepreneurship'],
    status: 'approved'
  },
  {
    title: 'National Youth Service (NYS) - Entrepreneurship Programme',
    description: 'The National Youth Service offers structured community and entrepreneurship projects for young people aged 18-35. Participants receive stipends while gaining valuable skills and work experience. Some participants are linked to entrepreneurship support programmes and small business grants. The programme focuses on skills development, community service, and creating pathways to employment or self-employment.',
    category: 'business',
    subcategory: 'Programme',
    organization: 'NYDA',
    contactEmail: 'nys@nyda.gov.za',
    website: 'https://www.nyda.gov.za',
    location: 'National',
    eligibility: 'Unemployed youth aged 18-35',
    requirements: ['SA ID', 'Matric certificate', 'Proof of unemployment', 'Motivation letter'],
    closingDate: '2026-12-31',
    amount: 'Monthly stipend + skills training',
    fundingType: 'Stipend',
    imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80',
    tags: ['youth', 'skills', 'entrepreneurship', 'nys', 'stipend'],
    status: 'approved'
  },
  {
    title: 'DSBD Township and Rural Entrepreneurship Programme (TREP)',
    description: 'TREP supports entrepreneurs in townships and rural areas across various sectors including retail, manufacturing, services, and creative industries. The programme offers blended finance (grants + loans) via SEFA and non-financial support through SEDA including mentorship, training, and market access. Designed to promote inclusive economic participation and job creation in underserved communities.',
    category: 'business',
    subcategory: 'Blended Finance',
    organization: 'DSBD / SEFA / SEDA',
    contactEmail: 'trep@dsbd.gov.za',
    website: 'https://www.dsbd.gov.za',
    location: 'Townships & Rural Areas',
    eligibility: 'Entrepreneurs in townships and rural areas',
    requirements: ['Business registration', 'Business plan', 'Proof of township/rural location', 'Financial statements', 'BEE documents'],
    closingDate: '2026-12-31',
    amount: 'Blended finance (amount varies)',
    fundingType: 'Blended',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80',
    tags: ['business', 'trep', 'township', 'rural', 'sefa'],
    status: 'approved'
  },

  // SUCCESS STORIES
  {
    title: 'From Learnership to Business Owner: Thabo\'s Success Story',
    description: 'Thabo Molefe, 27, from Soweto started with the UIF LAP Wholesale & Retail Learnership in 2023. After completing his programme, he worked as a store supervisor for 18 months before deciding to open his own general dealer shop in his community. "The learnership taught me everything - stock management, customer service, financial management. Today my shop employs 4 people and serves over 200 customers daily," says Thabo. He used his savings plus a R150,000 NYDA grant to start his business. His advice to youth: "Start with any opportunity you can find. Learn, save, then build your own dream."',
    category: 'success-story',
    subcategory: 'Entrepreneurship',
    organization: 'Youth Portal Success Stories',
    location: 'Soweto',
    imageUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&q=80',
    tags: ['success', 'entrepreneur', 'retail', 'learnership', 'soweto'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'Tech Graduate to Innovation Leader: Naledi\'s Journey',
    description: 'Naledi Khumalo graduated with a Computer Science degree in 2022 but struggled to find employment. She discovered the Danone Ascend Graduate Programme through this platform and was accepted. During her 24-month programme, she rotated through IT, supply chain, and innovation departments. "Danone didn\'t just give me a job, they invested in my growth," Naledi shares. Today, she\'s a permanent Innovation Data Analyst at Motus Corporation, earning a competitive salary and leading digital transformation projects. She mentors other graduates through virtual sessions, encouraging them to apply for graduate programmes even if they feel underqualified.',
    category: 'success-story',
    subcategory: 'Career Development',
    organization: 'Youth Portal Success Stories',
    location: 'Johannesburg',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
    tags: ['success', 'tech', 'graduate', 'career', 'innovation'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'Nursing Bursary Changed My Life: Zanele\'s Story',
    description: 'Zanele Dlamini from KwaMashu always dreamed of becoming a nurse but her family couldn\'t afford university fees. In 2021, she found the Department of Health Nursing Bursary on this platform. "I almost didn\'t apply because I thought there was no chance," she recalls. Today, Zanele is a qualified professional nurse at Inkosi Albert Luthuli Hospital, earning R18,000 monthly. She\'s bought her mother a house and is supporting her younger siblings through school. "This bursary didn\'t just change my life - it changed my entire family\'s trajectory," she says emotionally. Zanele now volunteers to help other youth with their bursary applications.',
    category: 'success-story',
    subcategory: 'Healthcare',
    organization: 'Youth Portal Success Stories',
    location: 'Durban',
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80',
    tags: ['success', 'nursing', 'bursary', 'healthcare', 'durban'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'ECD Learnership to Crèche Owner: Nomsa\'s Achievement',
    description: 'Nomsa Radebe, 29, from Mdantsane completed the Eastern Cape ECD Learnership in 2024. She worked at a local crèche for one year before applying for the Isiqalo Youth Fund. With R200,000 funding, she opened "Nomsa\'s Little Stars Crèche" which now cares for 35 children and employs 3 teachers. "I was unemployed for 5 years before the ECD learnership. Today I\'m a business owner providing quality education and creating jobs," Nomsa beams with pride. Her crèche is registered with the Department of Social Development and serves families in her community who couldn\'t afford expensive childcare. She plans to open a second location in 2026.',
    category: 'success-story',
    subcategory: 'Education & Business',
    organization: 'Youth Portal Success Stories',
    location: 'East London',
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80',
    tags: ['success', 'ecd', 'business', 'education', 'eastern-cape'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'From Unemployed Graduate to Transnet Professional: Sipho\'s Transformation',
    description: 'Sipho Mtshali graduated with a BCom in Supply Chain Management in 2023 but spent 8 months unemployed, sending over 100 applications with no success. He found the Transnet Rail Infrastructure internship on this platform and was accepted. "Those 24 months changed everything. I learned from the best in the industry, networked with professionals, and gained real experience," Sipho explains. Upon completing his internship, Transnet offered him a permanent position as a Supply Chain Coordinator earning R28,000 monthly. He recently bought his first car and is saving towards a house. His message to unemployed graduates: "Don\'t give up. One opportunity is all you need."',
    category: 'success-story',
    subcategory: 'Career Success',
    organization: 'Youth Portal Success Stories',
    location: 'Johannesburg',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    tags: ['success', 'graduate', 'transnet', 'career', 'internship'],
    status: 'approved'
  },

  // EVENTS
  {
    title: 'Eastern Cape Youth Employment Expo 2026',
    description: 'The biggest youth employment event in the Eastern Cape! Meet 50+ employers from manufacturing, retail, hospitality, and tech sectors actively recruiting. Free entry for all youth aged 18-35. The expo features: CV writing workshops (10am & 2pm), mock interviews with HR professionals, career guidance sessions, on-the-spot interviews with participating companies, entrepreneurship corner with NYDA and SEFA representatives, and networking lunch (registration required). Bring 20 copies of your CV, dress professionally, and be ready to make an impression. Companies attending: Transnet, Standard Bank, Shoprite, Mr Price, Woolworths, Mercedes Benz SA, and 44 more!',
    category: 'event',
    subcategory: 'Career Fair',
    organization: 'Eastern Cape Department of Economic Development',
    contactEmail: 'youthexpo@ecdoe.gov.za',
    contactPhone: '043-604-7000',
    website: 'https://www.ecdoe.gov.za/events',
    location: 'ICC East London',
    startDate: '2026-03-15',
    endDate: '2026-03-15',
    closingDate: '2026-03-10',
    eligibility: 'Youth aged 18-35',
    requirements: ['SA ID', 'CV copies (20)', 'Professional attire', 'Registration (walk-ins welcome)'],
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    tags: ['event', 'career', 'expo', 'networking', 'eastern-cape'],
    featured: true,
    urgent: true,
    status: 'approved'
  },
  {
    title: 'NYDA Entrepreneurship Bootcamp - Port Elizabeth',
    description: '5-day intensive entrepreneurship bootcamp designed to transform your business idea into reality. Day 1: Business Model Canvas & Market Research; Day 2: Financial Planning & Projections; Day 3: Digital Marketing & Social Media; Day 4: Pitching to Investors; Day 5: Business Registration & Legal Requirements. Guest speakers include successful entrepreneurs, angel investors, and NYDA grant officers. Limited to 40 participants. Includes meals, certificate of completion, and one year of mentorship. Top 3 business pitches win seed funding: 1st Place R50,000, 2nd Place R30,000, 3rd Place R20,000. Accommodation available for out-of-town participants (additional cost).',
    category: 'event',
    subcategory: 'Training',
    organization: 'NYDA Eastern Cape',
    contactEmail: 'bootcamp@nyda.gov.za',
    contactPhone: '041-582-2958',
    website: 'https://www.nyda.gov.za',
    location: 'Nelson Mandela Bay Business Hub, PE',
    startDate: '2026-04-20',
    endDate: '2026-04-24',
    closingDate: '2026-04-05',
    eligibility: 'Ages 18-35 with business idea',
    requirements: ['Business idea pitch (1 page)', 'SA ID', 'Commitment to attend all 5 days', 'R500 registration fee (refundable upon completion)'],
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
    tags: ['event', 'entrepreneurship', 'training', 'bootcamp', 'nyda'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'Bursary and Learnership Application Workshop - Mthatha',
    description: 'Free workshop to help youth successfully apply for bursaries and learnerships. Learn how to: write compelling motivation letters, complete application forms correctly, prepare required documents, create impressive CVs, prepare for interviews, find opportunities online. Bring your laptop/smartphone - we\'ll help you apply on the spot! NSFAS, Funza Lushaka, and corporate bursary representatives will be present to answer questions. Previous attendees have reported 70% application success rate. Facilitated by career counselors and HR professionals. First 100 registrants receive free data bundles (1GB) to use for applications. Light refreshments provided.',
    category: 'event',
    subcategory: 'Workshop',
    organization: 'Walter Sisulu University Career Centre',
    contactEmail: 'careercentre@wsu.ac.za',
    contactPhone: '047-502-2111',
    website: 'https://www.wsu.ac.za',
    location: 'Walter Sisulu University, Mthatha Campus',
    startDate: '2026-02-01',
    endDate: '2026-02-01',
    closingDate: '2026-01-25',
    eligibility: 'Grade 12 learners and unemployed youth',
    requirements: ['SA ID', 'Laptop/smartphone (if available)', 'Notebook and pen', 'Any documents you have'],
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
    tags: ['event', 'workshop', 'bursary', 'learnership', 'training'],
    urgent: true,
    status: 'approved'
  },
  {
    title: 'Tech Careers Expo - Johannesburg',
    description: 'Explore career opportunities in technology, IT, data science, and digital innovation. Meet representatives from tech giants, startups, and digital agencies. The expo features: company booths with job openings, coding challenges with prizes, tech demos and workshops, talks from industry leaders, CV review stations, networking sessions. Special focus on opportunities for youth without formal tech qualifications - learn about coding bootcamps, online courses, and tech learnerships. Prize pool: R100,000 in vouchers for online courses, laptops, and cash prizes for coding challenge winners. Register online for fast-track entry. Over 5,000 attendees expected.',
    category: 'event',
    subcategory: 'Career Fair',
    organization: 'Silicon Cape & Joburg Tech Hub',
    contactEmail: 'techexpo@siliconca pe.com',
    contactPhone: '011-244-8000',
    website: 'https://www.techcareersexpo.co.za',
    location: 'Gallagher Convention Centre, Johannesburg',
    startDate: '2026-05-10',
    endDate: '2026-05-11',
    closingDate: '2026-05-08',
    eligibility: 'Open to all (focus on youth opportunities)',
    requirements: ['Online registration (free)', 'CV copies', 'ID document'],
    imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80',
    tags: ['event', 'tech', 'career', 'expo', 'johannesburg'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'Women in Business Summit - Cape Town',
    description: 'Empowering young women entrepreneurs through inspiration, education, and networking. This two-day summit features keynote speeches from successful businesswomen, panel discussions on accessing funding, masterclasses on digital marketing and financial management, speed networking sessions, exhibition of women-owned businesses. Day 1 focuses on starting your business; Day 2 focuses on scaling and sustainability. Special sessions on: overcoming gender barriers, work-life balance, accessing finance, building confidence. Includes lunch, networking dinner, and summit pack. Limited exhibitor booths available for women-owned businesses (apply separately). Childcare services available on-site.',
    category: 'event',
    subcategory: 'Conference',
    organization: 'Women in Business Network SA',
    contactEmail: 'summit@wibn.co.za',
    contactPhone: '021-425-4500',
    website: 'https://www.womeninsummit.co.za',
    location: 'Cape Town International Convention Centre',
    startDate: '2026-06-15',
    endDate: '2026-06-16',
    closingDate: '2026-06-01',
    eligibility: 'Women entrepreneurs and aspiring business owners',
    requirements: ['Online registration', 'R500 ticket (youth discounted rate)', 'ID document'],
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
    tags: ['event', 'women', 'business', 'conference', 'cape-town'],
    status: 'approved'
  },

  // GRADUATE PROGRAMMES & INTERNSHIPS
  {
    title: 'Department of Tourism: Internships 2026',
    description: 'The Department of Tourism is offering internship opportunities for unemployed graduates in various fields including Tourism, Public Administration, Communication, HR, Supply Chain, and related disciplines. This 12-month internship programme provides practical work experience in government tourism operations, policy development, and tourism promotion. Interns receive a monthly stipend and gain valuable skills in the public sector.',
    category: 'career',
    subcategory: 'Internship',
    organization: 'Department of Tourism',
    contactEmail: 'internships@tourism.gov.za',
    website: 'https://www.graduates24.com/jobs/viewjob/13297',
    location: 'National',
    eligibility: 'SA citizens aged 18-35, unemployed with relevant qualification',
    requirements: ['Relevant Diploma or Degree', 'SA ID', 'No previous government internship', 'Good communication skills', 'Computer literacy'],
    startDate: '2026-02-01',
    closingDate: '2025-12-19',
    employmentType: 'Internship',
    salary: 'Monthly stipend',
    experience: 'Graduate',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
    tags: ['internship', 'tourism', 'government', 'graduate', 'national'],
    featured: true,
    urgent: true,
    status: 'approved'
  },
  {
    title: 'Department of Defence: Entry Level Secretary 2026',
    description: 'The Department of Defence is recruiting for Entry Level Secretary positions. This is an excellent opportunity to start your career in government administration. Responsibilities include administrative support, document management, correspondence handling, diary management, and general office duties. The role requires strong organizational skills, confidentiality, and the ability to work under pressure in a structured military environment.',
    category: 'career',
    subcategory: 'Administration',
    organization: 'Department of Defence',
    contactEmail: 'recruitment@dod.gov.za',
    website: 'https://www.graduates24.com/jobs/viewjob/13300',
    location: 'National',
    eligibility: 'Matric certificate, computer literate',
    requirements: ['Grade 12', 'MS Office proficiency', 'Good typing skills', 'Communication skills', 'Organizational ability'],
    startDate: '2026-01-15',
    closingDate: '2025-12-12',
    employmentType: 'Full-time',
    salary: 'Government salary scale',
    experience: 'Entry level',
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    tags: ['career', 'secretary', 'administration', 'government', 'entry-level'],
    urgent: true,
    status: 'approved'
  },
  {
    title: 'Danone: Ascend Graduate Development Programme 2026',
    description: '24-month graduate development programme offering comprehensive training and development in Finance, Accounting, Marketing, Engineering, or related fields. Work in both factory and office environments while rotating through different departments. Gain hands-on experience with a leading FMCG company, receive mentorship from industry experts, and fast-track your career. The programme includes structured learning, on-the-job training, and potential for permanent placement.',
    category: 'career',
    subcategory: 'Graduate Programme',
    organization: 'Danone',
    contactEmail: 'graduates@danone.com',
    website: 'https://www.graduates24.com/jobs/viewjob/13246',
    location: 'National',
    eligibility: 'Unemployed graduates with relevant Bachelor\'s degree',
    requirements: ['Bachelor\'s Degree (Finance, Accounting, Marketing, Engineering)', 'Strong academic record', 'Analytical skills', 'Teamwork abilities'],
    startDate: '2026-02-01',
    closingDate: '2025-12-04',
    employmentType: 'Graduate Programme',
    salary: 'Competitive stipend + benefits',
    experience: 'Graduate',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
    tags: ['graduate', 'programme', 'danone', 'fmcg', 'training'],
    featured: true,
    urgent: true,
    status: 'approved'
  },
  {
    title: 'Dwarsrivier Chrome Mine: Internships 2026',
    description: 'Dwarsrivier Chrome Mine is offering internship opportunities across various disciplines including Engineering, Geology, HR, Finance, Safety, and Environmental Management. Gain practical experience in the mining industry while working on real projects. The internship provides exposure to mining operations, safety protocols, and industry best practices. Preference given to candidates from local and surrounding communities.',
    category: 'career',
    subcategory: 'Internship',
    organization: 'Dwarsrivier Chrome Mine',
    contactEmail: 'hr@dwarsrivier.co.za',
    website: 'https://www.graduates24.com/jobs/viewjob/13304',
    location: 'Limpopo/Mpumalanga',
    eligibility: 'Relevant Diploma/Degree, medically fit',
    requirements: ['Relevant qualification', 'SA ID', 'No previous mining internship', 'Medical fitness certificate', 'Willingness to work in mining environment'],
    startDate: '2026-01-15',
    closingDate: '2025-11-28',
    employmentType: 'Internship',
    salary: 'Monthly stipend',
    experience: 'Graduate',
    imageUrl: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=800&q=80',
    tags: ['internship', 'mining', 'engineering', 'graduate', 'chrome'],
    urgent: true,
    status: 'approved'
  },
  {
    title: 'Rosebank College: Career Centre Internships (HR/Sales/Marketing)',
    description: 'Rosebank College Career Centre is seeking interns with qualifications in HR, Sales, or Marketing to support student recruitment, career guidance, and campus activities. This internship provides exposure to higher education operations, student support services, and career counseling. Ideal for recent graduates interested in education, recruitment, or student development. Gain experience in a dynamic campus environment while helping students achieve their career goals.',
    category: 'career',
    subcategory: 'Internship',
    organization: 'Rosebank College',
    contactEmail: 'careers@rosebankcollege.co.za',
    website: 'https://www.graduates24.com/jobs/viewjob/13302',
    location: 'Multiple Campuses',
    eligibility: 'Recent graduates in HR, Sales, or Marketing',
    requirements: ['Degree/Diploma in HR, Sales, or Marketing', 'Good communication skills', 'Customer service orientation', 'Computer literacy'],
    startDate: '2026-01-15',
    closingDate: '2025-11-30',
    employmentType: 'Internship',
    salary: 'Monthly stipend',
    experience: 'Graduate',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
    tags: ['internship', 'education', 'hr', 'marketing', 'sales'],
    urgent: true,
    status: 'approved'
  },
  {
    title: 'Motus: Innovation Data Analyst Internship 2026',
    description: '12-month internship opportunity for aspiring data analysts in the automotive industry. Work with innovation teams to analyze data, create visualizations, and support data-driven decision-making. Use tools like Excel, Power BI, and other analytics platforms to transform data into actionable insights. Perfect for graduates with strong analytical skills who want to launch their career in data analytics within a leading automotive group.',
    category: 'career',
    subcategory: 'Internship',
    organization: 'Motus Corporation',
    contactEmail: 'internships@motus.co.za',
    website: 'https://www.graduates24.com/jobs/viewjob/13296',
    location: 'Johannesburg',
    eligibility: 'Degree in Data Science, Statistics, Mathematics, or related field',
    requirements: ['Relevant degree', 'Excel proficiency', 'Power BI or similar tools', 'Analytical mindset', 'Problem-solving skills'],
    startDate: '2026-02-01',
    closingDate: '2025-12-01',
    employmentType: 'Internship',
    salary: 'Monthly stipend',
    experience: 'Graduate',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    tags: ['internship', 'data', 'analytics', 'motus', 'automotive'],
    featured: true,
    urgent: true,
    status: 'approved'
  },
  {
    title: 'Transnet Rail Infrastructure: Internships (Auditing, Finance, Law, Supply Chain)',
    description: '24-month internship programme at Transnet Rail Infrastructure for graduates in Auditing, Finance, Accounting, Law/LLB, and Supply Chain Management. Gain comprehensive experience in rail infrastructure operations, financial management, legal compliance, and supply chain logistics. Work at Transnet facilities in Johannesburg and other locations. This structured programme provides mentorship, skills development, and potential for permanent employment.',
    category: 'career',
    subcategory: 'Internship',
    organization: 'Transnet Rail Infrastructure',
    contactEmail: 'internships@transnet.net',
    website: 'https://www.graduates24.com/jobs/viewjob/13291',
    location: 'Johannesburg & Other Locations',
    eligibility: 'Unemployed graduates aged 18-35 with relevant qualification',
    requirements: ['Degree/Diploma in relevant field', 'SA ID', 'No prior formal work experience', 'Willingness to relocate', '24-month commitment'],
    startDate: '2026-02-01',
    closingDate: '2025-12-15',
    employmentType: 'Internship',
    salary: 'Monthly stipend',
    experience: 'Graduate',
    imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&q=80',
    tags: ['internship', 'transnet', 'rail', 'finance', 'law'],
    featured: true,
    status: 'approved'
  },
  {
    title: 'Transnet Rail Infrastructure: Technical Internships 2026',
    description: '24-month technical internship programme at Transnet Rail Infrastructure for Engineering and Project Management graduates. Work on real rail infrastructure projects, maintenance operations, and technical systems. Gain hands-on experience with rail technology, infrastructure development, and project execution. Excellent opportunity to build a career in rail engineering and infrastructure management with one of Africa\'s largest logistics companies.',
    category: 'career',
    subcategory: 'Internship',
    organization: 'Transnet Rail Infrastructure',
    contactEmail: 'internships@transnet.net',
    website: 'https://www.graduates24.com/jobs/viewjob/13287',
    location: 'Various Transnet Sites',
    eligibility: 'Technical qualification in Engineering or Project Management',
    requirements: ['Technical degree/diploma', 'SA ID', 'Ages 18-35', 'No previous Transnet internship', 'Willingness to travel'],
    startDate: '2026-02-01',
    closingDate: '2025-12-15',
    employmentType: 'Internship',
    salary: 'Monthly stipend',
    experience: 'Graduate',
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80',
    tags: ['internship', 'transnet', 'engineering', 'technical', 'rail'],
    status: 'approved'
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create admin user if doesn't exist
    console.log('\nChecking for admin user...');
    let adminUser = await User.findOne({ email: 'admin@youthportal.co.za' });
    
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@youthportal.co.za',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      console.log('✓ Admin user created (email: admin@youthportal.co.za, password: admin123)');
    } else {
      console.log('✓ Admin user already exists');
    }

    // Check if opportunities already exist
    const existingOppsCount = await Opportunity.countDocuments();
    
    if (existingOppsCount > 0) {
      console.log(`\n${existingOppsCount} opportunities already exist in database.`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Do you want to clear and re-seed? (yes/no): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        await Opportunity.deleteMany({});
        console.log('✓ Cleared existing opportunities');
      } else {
        console.log('Keeping existing opportunities');
        mongoose.connection.close();
        return;
      }
    }

    // Insert demo opportunities
    console.log('\nSeeding demo opportunities...');
    const opportunities = await Opportunity.insertMany(
      demoOpportunities.map(opp => ({
        ...opp,
        createdBy: adminUser._id,
        views: Math.floor(Math.random() * 500) + 50,
        applications: Math.floor(Math.random() * 50),
        // Add default closingDate if not present (for success stories, etc.)
        closingDate: opp.closingDate || opp.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      }))
    );
    
    console.log(`✓ Successfully created ${opportunities.length} demo opportunities`);
    
    // Seed forum posts with real-life scenarios
    console.log('\nSeeding forum posts...');
    const forumPosts = await ForumPost.insertMany([
      {
        title: 'Just got accepted for the UIF LAP Contact Centre Learnership! 🎉',
        content: 'I can\'t believe it! After months of searching for opportunities, I applied for the UIF LAP Contact Centre Learnership through this platform and just received my acceptance letter. For anyone thinking of applying, my advice is to be honest in your application and show your passion for customer service. The application form on the Ubuntu Institute website was straightforward (https://forms.zohopublic.com/ubuntuinstitute1/form/CONTACTCENTREUIFLEARNERSHIPAPPLICATIONS/formperma/pllkJ3qogOC5JwsrkkYoAMFLfOqfzwUtz_fVEeS5jN0). Now I\'m preparing to start in January 2026. Has anyone else been accepted or currently in a similar programme? Would love to connect and hear about your experiences!',
        category: 'success-stories',
        author: adminUser._id,
        tags: ['learnership', 'uif', 'contact-centre', 'success-story'],
        views: 287,
        likes: [adminUser._id],
        isPinned: true,
        lastActivity: new Date()
      },
      {
        title: 'Tips for NYDA Grant Application - I received R85,000!',
        content: 'Hey everyone! I successfully received R85,000 from the NYDA Grant Programme for my catering business. Here are my top tips:\n\n1. Write a DETAILED business plan - don\'t rush this part\n2. Get realistic quotations for everything you need\n3. Show how your business will create jobs\n4. Be prepared for the interview - they ask tough questions\n5. Have all your documents ready (ID, bank statements, proof of address)\n\nThe website is nydawebsite.azurewebsites.net and applications are processed continuously. The process took about 3 months from application to receiving the funds. The mentorship they provide is also amazing. Don\'t give up if you\'re rejected the first time - I applied twice before getting approved. Happy to answer any questions!',
        category: 'business',
        author: adminUser._id,
        tags: ['nyda', 'grant', 'business', 'funding', 'tips'],
        views: 342,
        likes: [adminUser._id],
        isPinned: true,
        lastActivity: new Date()
      },
      {
        title: 'Transnet Rail Infrastructure Internship Application Process',
        content: 'I\'m applying for the Transnet Rail Infrastructure internship (closing 15 December 2025) and wanted to share what I\'ve learned and ask for advice. The application is on graduates24.com/jobs/viewjob/13291 and requires:\n\n- Updated CV\n- Certified copies of qualifications\n- ID copy\n- Motivation letter\n\nDoes anyone have tips for the motivation letter? What should I focus on? Also, has anyone been through their interview process before? Any insights would be greatly appreciated. I\'m really excited about this opportunity - 24 months of experience with one of the biggest companies in Africa!',
        category: 'careers',
        author: adminUser._id,
        tags: ['transnet', 'internship', 'application', 'advice-needed'],
        views: 198,
        likes: [],
        lastActivity: new Date()
      },
      {
        title: 'Eastern Cape Youth - Isiqalo Fund is REAL! Just received R150,000 💰',
        content: 'To all my Eastern Cape youth who think these opportunities are fake - they are NOT! I just received R150,000 from the Isiqalo Youth Fund for my salon business in East London. The process was professional, they helped me refine my business plan, and provided mentorship throughout.\n\nIf you\'re from EC and have a business idea, APPLY! They specifically want to support us. The training they provided was invaluable - I learned about financial management, marketing, and customer service. My business is now registered, I have equipment, and I\'ve already hired 2 staff members.\n\nDon\'t let fear or doubt stop you. Take the chance! The website is ecprov.gov.za - look for Isiqalo Fund opportunities.',
        category: 'success-stories',
        author: adminUser._id,
        tags: ['isiqalo', 'eastern-cape', 'funding', 'success', 'youth'],
        views: 289,
        likes: [adminUser._id],
        isPinned: true,
        lastActivity: new Date()
      },
      {
        title: 'Danone Ascend Programme - Assessment Centre Experience',
        content: 'I attended the Danone Ascend Graduate Development Programme assessment centre last week and wanted to share my experience to help others preparing for it.\n\nThe day included:\n- Group discussion exercise (be collaborative, not competitive!)\n- Presentation on a business case\n- One-on-one interview with HR and department manager\n- Psychometric tests\n\nTips:\n1. Research Danone\'s values and products\n2. Dress professionally\n3. Be yourself - they want diverse personalities\n4. Show enthusiasm for FMCG industry\n5. Ask questions - show you\'re interested\n\nThe deadline is 4 December 2025, so apply NOW if you\'re interested! Link: graduates24.com/jobs/viewjob/13246. The programme is 24 months and they train you in multiple departments.',
        category: 'careers',
        author: adminUser._id,
        tags: ['danone', 'graduate-programme', 'interview', 'tips', 'assessment'],
        views: 234,
        likes: [adminUser._id],
        lastActivity: new Date()
      },
      {
        title: 'SEFA Loan Application - What you need to know about collateral',
        content: 'I\'ve been researching SEFA funding for my manufacturing business and learned some important things about collateral requirements that I want to share:\n\n1. For loans under R500k, requirements are more flexible\n2. They accept business assets as collateral (equipment, vehicles, stock)\n3. Personal guarantees may be required\n4. Strong business plan can reduce collateral requirements\n5. They prefer movable assets over property\n\nHas anyone here successfully secured SEFA funding? What was your experience with the collateral requirements? My business needs about R800k for equipment and I\'m trying to figure out the best approach.\n\nAlso, their interest rates are much better than commercial banks. The website is sefa.org.za - applications are open year-round.',
        category: 'business',
        author: adminUser._id,
        tags: ['sefa', 'funding', 'loan', 'business', 'collateral'],
        views: 176,
        likes: [],
        lastActivity: new Date()
      },
      {
        title: 'KVR Training Academy Learnership - January 2026 Intake',
        content: 'Good day everyone! I\'m starting the KVR Training Academy learnership in January 2026 and looking for others who will be in the same programme. It would be great to connect before we start.\n\nFrom what I understand, it\'s a 12-month programme with both theoretical training and workplace experience. The website (kvrlearner-recruitment.online/faq) has a FAQ section that answers most questions, but I still have some:\n\n1. Do they provide accommodation or is it remote?\n2. What is the monthly stipend?\n3. Which companies do they place learners with?\n\nIf anyone has been through KVR Training Academy before or knows someone who has, please share your experience. The closing date is 20 January 2026, so there\'s still time to apply!',
        category: 'learnerships',
        author: adminUser._id,
        tags: ['kvr', 'learnership', 'training', '2026', 'january'],
        views: 143,
        likes: [],
        lastActivity: new Date()
      },
      {
        title: 'Google Black Founders Fund - Application Tips from a Finalist',
        content: 'Hi tech entrepreneurs! I was a finalist for the Google for Startups Black Founders Fund: Africa last year (didn\'t win, but learned A LOT). Here\'s what I wish I knew:\n\n**What They Look For:**\n- Scalable tech solution (not just a service business)\n- Clear understanding of your market\n- Strong founding team\n- Evidence of traction (users, revenue, partnerships)\n- Social impact potential\n\n**Application Tips:**\n- Pitch deck should be 10-15 slides max\n- Focus on the PROBLEM you\'re solving\n- Show your unique advantage\n- Be realistic with financials\n- Demonstrate tech capability\n\n**Common Mistakes:**\n- Applying too early (no MVP or traction)\n- Copying other people\'s ideas\n- Unrealistic projections\n- Poor presentation quality\n\nThe website is startup.google.com - check regularly for application windows. It\'s equity-free funding, which is rare! Even if you don\'t win, the exposure and feedback are valuable.',
        category: 'business',
        author: adminUser._id,
        tags: ['google', 'tech', 'startup', 'funding', 'black-founders'],
        views: 267,
        likes: [adminUser._id],
        lastActivity: new Date()
      },
      {
        title: 'ECD Learnership Eastern Cape - Application Deadline 7 Feb 2025! ⚠️',
        content: '⚠️ URGENT - Deadline approaching! ⚠️\n\nThe Eastern Cape ECD (Early Childhood Development) Learnership closes on 7 February 2025. This is a 12-month ETDP SETA accredited programme.\n\nPerfect for anyone who:\n✓ Loves working with children\n✓ Has Grade 12\n✓ Lives in Eastern Cape\n✓ Wants a career in education\n\nYou don\'t need previous experience! They provide full training in:\n- Child development\n- Nutrition\n- Play-based learning\n- Safety and first aid\n- Classroom management\n\nAfter completion, you can work in:\n- Crèches\n- Pre-schools\n- After-care centers\n- Home-based care\n\nEmail your application to: KhanyisileH@etdpseta.org.za\n\nInclude: CV, certified ID, Matric certificate, motivation letter, criminal clearance\n\nDon\'t miss this opportunity! ECD sector is growing and there\'s huge demand for qualified practitioners.',
        category: 'learnerships',
        author: adminUser._id,
        tags: ['ecd', 'learnership', 'eastern-cape', 'urgent', 'education'],
        views: 312,
        likes: [adminUser._id],
        isPinned: true,
        lastActivity: new Date()
      },
      {
        title: 'Wholesale & Retail Learnership - My Experience (Month 3)',
        content: 'Hi everyone! I\'m 3 months into the UIF LAP Wholesale & Retail Learnership and wanted to share my experience so far.\n\n**The Good:**\n- Learning real retail skills (stock management, merchandising, customer service)\n- Getting paid while learning\n- My workplace mentor is amazing\n- The college training is practical, not just theory\n- I already feel more confident and employable\n\n**The Challenging:**\n- Balancing work days and college days\n- Retail hours can be long (including weekends)\n- The stipend is modest, budget carefully\n- Lots of assignments and assessments\n\n**My Advice:**\n- Take it seriously from day 1\n- Ask questions - everyone is there to help\n- Network with other learners\n- Complete assignments on time\n- Show up with a good attitude\n\nAfter this programme, I\'ll have a National Certificate and real work experience. Already planning to apply for supervisor positions once I complete. If you\'re thinking about applying, DO IT! Application link: forms.zohopublic.com/ubuntuinstitute1/form/WHOLESALERETAILUIFLEARNERSHIPAPPLICATIONS',
        category: 'success-stories',
        author: adminUser._id,
        tags: ['retail', 'learnership', 'uif', 'experience', 'wholesale'],
        views: 195,
        likes: [adminUser._id],
        lastActivity: new Date()
      },
      {
        title: 'Department of Tourism Internships - Anyone else applied?',
        content: 'I submitted my application for the Department of Tourism Internships 2026 (deadline 19 December). The application was on graduates24.com/jobs/viewjob/13297. Has anyone else applied or been through their recruitment process before?\n\nI\'m particularly interested in the tourism marketing and communication roles. The 12-month internship seems like a great opportunity to gain government work experience.\n\nWhat I included in my application:\n- Updated CV highlighting my tourism diploma\n- Certified copies of all qualifications\n- Motivation letter (2 pages)\n- References from lecturers\n\nNow the waiting game begins! Good luck to everyone who applied.',
        category: 'careers',
        author: adminUser._id,
        tags: ['tourism', 'internship', 'government', 'application'],
        views: 124,
        likes: [],
        lastActivity: new Date()
      },
      {
        title: 'How I got SAB Foundation funding - R450,000!',
        content: 'I\'m so grateful! Just received news that SAB Foundation approved my application for R450,000 for my beverage distribution business. Here\'s my journey:\n\n**Timeline:**\n- Applied: March 2025\n- First interview: May 2025\n- Business plan review: June 2025\n- Final presentation: July 2025\n- Approval: November 2025\n\n**What helped me succeed:**\n1. Innovative business model (not just copying others)\n2. Clear market research and data\n3. Realistic 3-year financial projections\n4. Strong management team\n5. Clear job creation plan (I committed to hiring 8 people)\n\n**The application:**\nWebsite: sabfoundation.co.za\nThey have specific application windows, so check regularly!\n\nThe mentorship component is incredible - they pair you with industry experts. This is not just money, it\'s a complete business support system. If you have an innovative, scalable idea, APPLY!',
        category: 'success-stories',
        author: adminUser._id,
        tags: ['sab', 'funding', 'business', 'success', 'grant'],
        views: 298,
        likes: [adminUser._id],
        isPinned: true,
        lastActivity: new Date()
      }
    ]);
    
    console.log(`✓ Successfully created ${forumPosts.length} forum posts`);
    
    // Add some comments to forum posts
    const comments = await ForumComment.insertMany([
      {
        post: forumPosts[0]._id,
        author: adminUser._id,
        content: 'Congratulations! This is so inspiring. I\'m going to apply today!',
        likes: [adminUser._id]
      },
      {
        post: forumPosts[1]._id,
        author: adminUser._id,
        content: 'Same struggle here. I found volunteering helped me get some experience. Also try internships - they usually don\'t require experience.',
        likes: []
      },
      {
        post: forumPosts[2]._id,
        author: adminUser._id,
        content: 'You\'ll need a health certificate from your municipality and possibly a food handler\'s certificate. Budget around R2000 for licenses and permits.',
        likes: [adminUser._id]
      },
      {
        post: forumPosts[3]._id,
        author: adminUser._id,
        content: 'Be yourself and be honest. Research the company before the interview. Dress smart casual for retail. Prepare examples of when you showed good customer service (even from school or home). Good luck!',
        likes: []
      }
    ]);
    
    console.log(`✓ Successfully created ${comments.length} forum comments`);
    
    console.log('\n=== Seed Summary ===');
    console.log(`Total Opportunities: ${opportunities.length}`);
    console.log(`  - Bursaries: ${opportunities.filter(o => o.category === 'bursary').length}`);
    console.log(`  - Careers: ${opportunities.filter(o => o.category === 'career').length}`);
    console.log(`  - Learnerships: ${opportunities.filter(o => o.category === 'learnership').length}`);
    console.log(`  - Business Funding: ${opportunities.filter(o => o.category === 'business').length}`);
    console.log(`  - Success Stories: ${opportunities.filter(o => o.category === 'success-story').length}`);
    console.log(`  - Events: ${opportunities.filter(o => o.category === 'event').length}`);
    console.log(`  - Featured: ${opportunities.filter(o => o.featured).length}`);
    console.log(`  - Urgent: ${opportunities.filter(o => o.urgent).length}`);
    console.log(`Forum Posts: ${forumPosts.length}`);
    console.log(`Forum Comments: ${comments.length}`);
    
    console.log('\n✓ Database seeded successfully!');
    console.log('\nAdmin credentials:');
    console.log('  Email: admin@youthportal.co.za');
    console.log('  Password: admin123');
    
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seed
seedDatabase();

