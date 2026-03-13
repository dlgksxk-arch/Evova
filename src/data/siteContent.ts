export type SitePage =
  | 'home'
  | 'how-it-works'
  | 'hanbok-guide'
  | 'fashion-blog'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'contact';

export interface ContentSection {
  heading: string;
  subheading?: string;
  paragraphs: string[];
}

export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  paragraphs: string[];
}

export interface PageContent {
  title: string;
  description: string;
  sections?: ContentSection[];
  articles?: BlogArticle[];
}

export const NAV_ITEMS: Array<{ page: SitePage; label: string }> = [
  { page: 'home', label: 'Home' },
  { page: 'how-it-works', label: 'How It Works' },
  { page: 'hanbok-guide', label: 'Hanbok Guide' },
  { page: 'fashion-blog', label: 'Fashion Blog' },
  { page: 'about', label: 'About HAMDEVA' },
  { page: 'privacy', label: 'Privacy Policy' },
  { page: 'terms', label: 'Terms of Service' },
  { page: 'contact', label: 'Contact' },
];

export const HOME_TOP_SECTIONS: ContentSection[] = [
  {
    heading: 'What Is HAMDEVA',
    paragraphs: [
      `HAMDEVA is an informational fashion technology website focused on helping people understand and experience Korean traditional dress through AI virtual try-on. The service combines educational storytelling with a practical digital fitting tool, allowing visitors to explore Hanbok culture while also seeing how different garments may look on their own photos. Instead of presenting the tool as a novelty feature, HAMDEVA frames virtual fitting as part of a broader conversation about heritage fashion, digital creativity, and the future of accessible styling.`,
      `For many international visitors, Hanbok is visually striking but unfamiliar. They may recognize the graceful silhouette, layered skirts, tied ribbons, and vivid colors, yet still wonder about historical context, seasonal variations, or the difference between ceremonial and everyday attire. HAMDEVA helps bridge that gap by pairing informative editorial content with interactive experimentation. A visitor can read about the meaning of color combinations, the occasion behind certain garments, and the modern revival of Hanbok, then immediately test how a selected look might appear in a realistic virtual fitting environment.`,
    ],
  },
  {
    heading: 'How AI Virtual Try-On Works',
    paragraphs: [
      `The AI process is designed to be understandable even if you are not a technical user. First, the system uses a face or portrait photo as an identity reference so the output keeps the same person, facial impression, and general body presence. Next, a clothing image is used as the strongest visual reference for silhouette, surface details, trim, and styling. The generation engine then composes a single image sheet that presents the outfit on the same person from multiple coordinated angles.`,
      `What makes this useful is not just the novelty of image generation, but the way it reduces uncertainty. Cultural garments like Hanbok often depend on proportion, sleeve structure, layering, and balance between top and skirt or robe. Static product photos do not fully answer how a garment may read on a person. HAMDEVA makes the decision process more visual by translating those reference images into a coherent try-on result. That supports learning, styling inspiration, and pre-purchase confidence without replacing the value of real garments or in-person craftsmanship.`,
    ],
  },
  {
    heading: 'Why Hanbok Is Special',
    paragraphs: [
      `Hanbok is more than a traditional outfit. It is a living design language shaped by movement, seasonality, social meaning, and ceremony. The curved lines, generous volume, and carefully chosen colors create a distinctive sense of rhythm that differs from most Western tailoring traditions. Even small design choices such as the length of a jeogori, the shape of sleeves, or the contrast between skirt and ribbon can change the feeling of a look from formal and stately to youthful, modern, or celebratory.`,
      `Today, Hanbok is worn during holidays, weddings, first-birthday celebrations, family portraits, and cultural festivals, but it also appears in tourism, performance, editorial photography, and modern reinterpretations by contemporary designers. That range makes Hanbok especially well suited to an educational try-on site. Visitors are not only asking “Will this look good on me?” They are also asking “What kind of Hanbok is this?” and “Why does this style feel elegant, historic, or modern?” HAMDEVA treats those questions as part of the same experience.`,
    ],
  },
];

export const HOME_BOTTOM_SECTIONS: ContentSection[] = [
  {
    heading: 'Try Hanbok Online',
    paragraphs: [
      `The try-on area on the homepage is meant to feel like the practical extension of the articles around it. After learning about Hanbok history, style categories, and visual meaning, visitors can upload a portrait or choose a sample face, then pair it with a selected garment image. The system generates a studio-style fitting result so the user can compare front, angled, and back-oriented styling in one combined sheet. This makes it easier to think about proportion, mood, and garment identity before making a styling decision.`,
      `HAMDEVA encourages careful experimentation. Better lighting, a clear face photo, and a clean garment reference generally produce stronger results. When the clothing image is detailed and the body framing is easy to read, the output is more faithful to ribbons, embroidery, trim, and silhouette. In that sense, the tool works best when users understand both the cultural garment and the technical input. That is why the website combines education and utility: strong content helps users make better choices, and better choices lead to better virtual try-on results.`,
    ],
  },
];

export const PAGE_CONTENT: Record<Exclude<SitePage, 'home'>, PageContent> = {
  'how-it-works': {
    title: 'How HAMDEVA AI Virtual Try-On Works',
    description: 'Learn how HAMDEVA turns a portrait image and a Hanbok reference into a realistic multi-angle virtual try-on sheet.',
    sections: [
      {
        heading: 'Step 1 – Upload a Face Photo',
        paragraphs: [
          `The first part of the process starts with a portrait or upper-body image that gives the system a reliable identity reference. HAMDEVA uses this photo to understand the face, hairstyle, skin tone, and visual character of the person who will appear in the final try-on result. This does not mean the tool simply pastes a face onto a mannequin. Instead, it uses the reference photo to guide the overall likeness so the generated result feels like the same person across all panels. A clear image matters because soft focus, heavy filters, strong shadows, masks, or hands covering the face reduce the quality of identity preservation.`,
          `In practice, the best face photo is front-facing or close to front-facing, evenly lit, and simple in composition. A plain background helps, but it is not as important as facial clarity. The system performs better when the head is not cropped too tightly and when the upper body is at least partially visible. This gives the model a better sense of scale and posture. If a user wants the most convincing result, they should choose a photo that looks natural and current rather than a highly stylized selfie or an image with extreme perspective distortion.`,
        ],
      },
      {
        heading: 'Step 2 – Select a Hanbok or Clothing Reference',
        paragraphs: [
          `The second input is the clothing reference, and in HAMDEVA this is the strongest visual source for the final garment. The AI is instructed to preserve silhouette, color, decorative trim, fabric impression, sleeve shape, ribbon placement, and other distinguishing details as faithfully as possible. This is especially important for Hanbok because much of its identity comes from structure and ornament rather than simple surface pattern. A product image with visible front details is often ideal, but a clean editorial image can also work as long as the garment itself is easy to read.`,
          `When a garment image is busy, partially blocked, or poorly cropped, the system may have to infer missing details. That is why the website emphasizes sample selection and educational guidance. Visitors can explore organized categories such as women’s Hanbok, men’s Hanbok, classic fashion references, future-inspired looks, or animal garments, then choose a sample that presents the clothing clearly. The better the input image communicates the design, the more consistent the try-on output becomes across front, angled, and back-oriented views.`,
        ],
      },
      {
        heading: 'Step 3 – AI Generates the Try-On Image',
        paragraphs: [
          `After the portrait and garment references are prepared, HAMDEVA sends one generation request to the image model. Instead of calling the model four separate times, the system asks for one single wide 1x4 composite image. That instruction matters because it improves visual consistency. The model is guided to show the same person wearing the same garment in four coordinated panels: front view, left 45-degree view, right 45-degree view, and back view. This layout helps users evaluate silhouette and styling from multiple angles without paying the cost or accepting the inconsistency of multiple unrelated generations.`,
          `The output is intended to resemble premium studio fashion photography. That means lighting should be soft and consistent, the background should remain clean and unobtrusive, and the full clothing silhouette should be visible whenever possible. HAMDEVA also tries to preserve posture and body proportions naturally, especially when body profile hints such as height or weight are available. The result is not a replacement for real fittings or tailor consultation, but it is a strong visual planning tool for cultural fashion exploration, styling previews, and editorial inspiration.`,
        ],
      },
      {
        heading: 'Helpful Tips for Better Results',
        paragraphs: [
          `Users often assume the AI is doing all the work, but input quality still matters. If you want stronger realism, use a portrait that feels neutral and readable rather than dramatic. Avoid tinted nightclub lighting, extreme beauty filters, heavy motion blur, and sunglasses that hide the eyes. For clothing, avoid images where the garment is folded, partially hidden, or merged into a complex environment. Clear inputs reduce ambiguity and help the model spend more of its effort on faithful reconstruction rather than guesswork.`,
          `It is also useful to think in terms of storytelling. A formal Hanbok for a wedding portrait should look different from a travel Hanbok for palace photography, and both should feel different from a modern reinterpretation worn for a fashion editorial. Choosing references that align in mood gives the generation model a clearer direction. The more coherent the identity image and garment image are together, the more convincing the final multi-angle sheet will feel.`,
        ],
      },
      {
        heading: 'Why the Result Uses Four Angles',
        paragraphs: [
          `Most online fashion previews show only one static front-facing image. That can be useful for catalog browsing, but it does not fully answer how a garment behaves. Hanbok is especially dependent on side profile, back drape, sleeve curve, and the balance of volume around the torso and lower body. A single front image hides too much. By generating four coordinated panels in one composition, HAMDEVA gives the viewer a broader design understanding. The user can assess whether a ribbon feels balanced, whether the back view remains elegant, and whether the side angles preserve the garment’s intended silhouette.`,
          `This four-angle approach also supports comparison and memory. When all views appear in one sheet, the viewer can evaluate them as one styling statement rather than as unrelated pictures. That makes the output more useful for shopping, presentation, family discussion, or cultural event planning. In other words, the format itself is part of the product: it turns AI imagery into a structured visual aid rather than a one-off novelty render.`,
        ],
      },
      {
        heading: 'What HAMDEVA Is Best Used For',
        paragraphs: [
          `HAMDEVA works well as an educational companion, a styling exploration tool, and a pre-visualization aid. It is particularly useful for people who are curious about Hanbok but are not yet familiar enough to judge shape and color from a product photo alone. It can also help content creators, tourists planning cultural experiences, families preparing formal portraits, or designers researching how traditional garments are perceived in digital space. By combining background reading with a practical try-on workflow, the site creates a more meaningful experience than a standalone image generator.`,
          `At the same time, HAMDEVA should be used with realistic expectations. A digital try-on is an interpretation built from image references, not a tailoring measurement system. The output can support conversation, taste, and confidence, but it does not replace artisan knowledge, physical material behavior, or expert fitting. The strongest use case is informed exploration: learn from the articles, choose inputs carefully, generate one coherent 1x4 try-on sheet, and use that result as part of a smarter fashion decision process.`,
        ],
      },
    ],
  },
  'hanbok-guide': {
    title: 'Hanbok Guide: History, Meaning, and Modern Life',
    description: 'A long-form guide to the history of Hanbok, its silhouettes, colors, symbolism, and the way Koreans wear it today.',
    sections: [
      {
        heading: 'History of Hanbok',
        paragraphs: [
          `Hanbok is the traditional dress of Korea, but the term describes more than one fixed historical costume. Over centuries, Hanbok evolved in response to climate, status, philosophy, ceremony, and aesthetics. Earlier forms of Korean dress reflected practical needs: layering for seasonal change, mobility for daily life, and silhouettes shaped by textile width and construction methods. Over time, the clothing also became a visual language that communicated dignity, refinement, age, marital status, and occasion. Court dress, commoner clothing, ceremonial garments, and regional variations all contributed to the wider tradition now grouped under the modern word Hanbok.`,
          `By the Joseon period, many of the silhouettes that people associate with Hanbok had become recognizable, although proportions continued to shift. Women’s jeogori lengths, skirt volume, sleeve curves, and ribbon placement changed according to period taste. Men’s clothing developed around layers that balanced ease, dignity, and social convention. The overall visual effect was rarely accidental. Hanbok was designed to move with the body and to create elegant lines even when the wearer was standing still. This sense of balance and restraint is part of why Hanbok continues to feel distinctive in photographs and on stage today.`,
        ],
      },
      {
        heading: 'Types of Hanbok',
        paragraphs: [
          `Many first-time viewers think of Hanbok as one garment, but it is better understood as a family of garments and styling systems. For women, the most commonly recognized arrangement includes the jeogori, or short jacket, paired with the chima, or full skirt. Depending on purpose and status, this combination can become more formal, more layered, or more restrained. Wedding Hanbok, palace-style ceremonial attire, modern rental Hanbok, and designer reinterpretations may all belong to the same broader tradition while looking quite different in detail and emphasis.`,
          `For men, Hanbok often centers on a jeogori paired with baji, or trousers, along with outer garments such as durumagi or other robes depending on the formality of the occasion. Accessories and headwear can also matter significantly. In addition, there are children’s garments, performance costumes, and seasonal adaptations. Contemporary audiences also encounter “modern Hanbok,” which simplifies or reinterprets elements for everyday wear while retaining some of the traditional structure, palette, or movement. Understanding these categories helps visitors avoid treating Hanbok as a single costume and instead see it as a living design system with internal variety.`,
        ],
      },
      {
        heading: 'Hanbok Colors and Meanings',
        paragraphs: [
          `Color has long carried symbolic and aesthetic importance in Korean dress. While individual garments are chosen for personal, seasonal, or design reasons, color traditions are also influenced by Korean concepts such as harmony, directional symbolism, and ceremonial appropriateness. Bright contrasts can suggest celebration and visibility, while softer tones may communicate elegance, restraint, or maturity. Children’s garments historically used lively combinations, and formal or ritual garments could signal rank, event type, or social meaning through coordinated color choices.`,
          `Modern viewers do not need to memorize a strict symbolic code to appreciate Hanbok color. It is enough to notice that color in Hanbok is often structural rather than decorative. The contrast between jacket, ribbon, skirt, cuffs, lining, and trim helps define the garment’s rhythm. A red skirt with a pale jacket feels different from a muted layered palette, even when the silhouette stays similar. That is one reason virtual try-on can be so useful: it lets the viewer see how color relationships function on a body, not just as flat product photography.`,
        ],
      },
      {
        heading: 'Fabric, Shape, and Movement',
        paragraphs: [
          `Hanbok is often described in terms of beauty, but its visual effect depends heavily on material behavior. The way fabric bends, lifts, overlaps, and catches light can transform the garment. Stiffer materials may emphasize ceremonial form, while softer textiles can create fluidity and softness. Sleeve volume, skirt fullness, and front overlap all interact with fabric weight. This is why accurate representation requires more than simply copying a pattern. To understand Hanbok, one must pay attention to how silhouette and material impression work together.`,
          `Shape in Hanbok is also related to posture and movement. Because many forms of Hanbok involve volume rather than close body contouring, the garment creates its own architecture around the body. That architecture becomes especially expressive when walking, turning, sitting, or standing for portraits. A front-facing photo can never tell the whole story. Side and back views often reveal the true balance of a look. The AI try-on sheet on HAMDEVA is built around that insight, showing how clothing identity remains legible from multiple directions rather than just one flat pose.`,
        ],
      },
      {
        heading: 'When Koreans Wear Hanbok Today',
        paragraphs: [
          `Hanbok remains present in contemporary Korea, but not always in the same context as in earlier centuries. Many Koreans wear Hanbok for major holidays such as Seollal and Chuseok, for weddings, first-birthday celebrations, family ceremonies, and formal portraits. Tourists and young adults also wear rental Hanbok in cultural districts and palace areas, turning the garment into both a heritage experience and a photographic event. In these contexts, Hanbok is often associated with celebration, respect, memory, and visual identity.`,
          `At the same time, the meaning of Hanbok is expanding. Designers, performers, museums, stylists, and even pop culture productions continue to reinterpret it. Some versions lean heavily toward historical authenticity, while others blend old and new design logic. This means that the question “When is Hanbok worn?” now has multiple answers. It can be ritual, tourism, fashion experiment, cultural education, artistic statement, or family tradition. That flexibility helps explain why a digital informational platform such as HAMDEVA can be relevant today.`,
        ],
      },
      {
        heading: 'Hanbok in Global Fashion Culture',
        paragraphs: [
          `As Korean culture has gained broader international attention through cinema, music, design, and tourism, Hanbok has become more visible worldwide. Global audiences often encounter it first through stylized images, music video costuming, or palace travel photography. That visibility is valuable, but it also creates risk. Without context, Hanbok may be reduced to a costume aesthetic rather than understood as a historical and living tradition. Informational content therefore matters. Good cultural presentation should explain not only what a garment looks like, but why it carries meaning and how it relates to the people who wear it.`,
          `Digital tools can support that educational goal when they are used responsibly. A virtual try-on experience should not claim to replace craftsmanship or cultural knowledge. Instead, it can help international visitors approach Hanbok with curiosity and respect. When users can read about history, symbolism, and use cases before interacting with the try-on tool, the technology becomes part of a broader learning journey. That is the role HAMDEVA aims to play: not just a generator, but a gateway to more informed appreciation of Korean dress culture.`,
        ],
      },
      {
        heading: 'Why Hanbok Matters in the Digital Era',
        paragraphs: [
          `The digital era changes how people encounter clothing. Many decisions now begin on a screen long before they involve a fitting room, tailor, or cultural event. That can flatten complex garments into thumbnails and quick impressions. Hanbok suffers from this when it is presented without scale, movement, or explanation. Yet the same digital environment also offers new opportunities. A well-designed content site can bring together articles, guided imagery, styling references, and AI tools to help users understand garments more deeply before making choices.`,
          `This is particularly important for heritage fashion. Traditional clothing often carries history, symbolism, and craft traditions that do not fit neatly into modern ecommerce patterns. By combining long-form educational material with visual technology, websites can help users move beyond surface attraction toward real understanding. In that sense, a Hanbok guide is not separate from a virtual try-on tool. Each strengthens the other. The articles teach the viewer what to notice, and the visual output gives those ideas a more immediate form.`,
        ],
      },
      {
        heading: 'How to Explore Hanbok Thoughtfully',
        paragraphs: [
          `A thoughtful exploration of Hanbok begins with curiosity and patience. Start by noticing silhouette before ornament. Then look at color relationships, sleeve line, skirt volume, and the emotional tone of the outfit. Ask whether the garment feels ceremonial, playful, romantic, restrained, or modern. Learn a few basic garment terms so that product images become easier to interpret. When possible, compare front, side, and back views because Hanbok is designed as a three-dimensional experience, not a flat graphic surface.`,
          `After that, virtual try-on becomes much more useful. Instead of randomly testing images, you can make informed comparisons. You may notice that one jacket length feels more balanced with a certain skirt, or that a muted palette suits a formal portrait better than a high-contrast color set. You may also discover that some details that seem minor in a product shot become central in the final look. That is the value of combining educational reading with AI-assisted visualization. It helps turn attention into judgment, and judgment into better styling decisions.`,
        ],
      },
    ],
  },
  'fashion-blog': {
    title: 'Fashion Blog',
    description: 'Read in-depth articles about Hanbok history, modern fashion technology, and the future of virtual try-on.',
    articles: [
      {
        slug: 'history-of-korean-hanbok-fashion',
        title: 'The History of Korean Hanbok Fashion',
        description: 'A long-form overview of how Hanbok evolved from historical dress to a modern cultural symbol.',
        paragraphs: [
          `Hanbok fashion is often described as timeless, but its history is full of change. The garments we now associate with Korean identity emerged through centuries of practical adaptation, social convention, and aesthetic refinement. The silhouette that appears familiar in museums, period dramas, and ceremonial portraits is not the result of one frozen historical moment. It is the outcome of many overlapping periods in which fabric technologies, social hierarchy, regional practice, and court influence all shaped the look of Korean dress. Understanding that layered history helps explain why Hanbok feels both ancient and alive.`,
          `Early forms of Korean dress were shaped by climate and movement. Layered construction helped manage weather variation, while wrapped and tied forms allowed garments to adapt to the body without relying on highly fitted tailoring. As Korean society developed under different kingdoms and later through Joseon-era systems, clothing became more codified. Formality, role, gender, age, and ceremony could all influence how a garment was cut, layered, and decorated. Over time, the lines of Hanbok became more visually expressive, with balance between volume and restraint emerging as one of its most distinctive qualities.`,
          `The Joseon era is especially important in public imagination because many iconic Hanbok features became highly recognizable then. Women’s jackets shortened in certain periods, skirt volume shifted, and the visual relationship between top and bottom changed over time. Men’s dress continued to reflect a different balance of dignity, function, and layered structure. Yet even within this era, Hanbok was not static. Fashion moved. Taste changed. Elite and everyday clothing were not identical. This is why treating Hanbok as one single costume can be misleading. It is better seen as a historical design conversation that continued to evolve.`,
          `In the modern period, Hanbok began to occupy a more selective place in daily life as Western dress became widespread. For some, this could have signaled decline. Instead, Hanbok changed roles. It became strongly associated with ceremony, heritage, family memory, and visual identity. Weddings, holiday gatherings, first-birthday events, and official cultural moments kept Hanbok visible, while modern designers began experimenting with ways to reinterpret it for contemporary wear. This shift from everyday necessity to symbolic and expressive garment gave Hanbok a different kind of power. It became less common in routine life, but more intentional when worn.`,
          `Today, Hanbok exists across several overlapping worlds. It lives in traditional formalwear, tourism rental culture, palace photography, museum education, K-drama costume imagination, performance styling, modern design collections, and digital fashion experimentation. Each of these spaces emphasizes a different aspect of Hanbok. A heritage museum may emphasize historical accuracy. A rental shop may prioritize visual delight and photography. A designer may focus on the emotional qualities of line and movement. A technology platform such as HAMDEVA may ask how these visual codes can be explored through AI while still respecting the core identity of the garment.`,
          `That modern visibility also changes how Hanbok is discussed internationally. Many people first see it online, often detached from context. Images spread faster than explanations. This can create admiration, but also flatten meaning. A strong informational fashion site helps address that problem by pairing images with history, terminology, and structured comparison. When users can learn how Hanbok evolved, how silhouettes changed, and why certain garments feel ceremonial or modern, the clothing becomes richer. The point is not to overwhelm viewers with detail, but to help them see that Hanbok fashion is an evolving tradition rather than a decorative snapshot from the past.`,
        ],
      },
      {
        slug: 'modern-hanbok-trends',
        title: 'Modern Hanbok Trends',
        description: 'How designers reinterpret Hanbok for daily wear, editorial fashion, and global audiences.',
        paragraphs: [
          `Modern Hanbok is not simply traditional Hanbok with shorter hemlines or softer colors. It is a broad design field in which creators decide which elements of tradition to preserve, which to simplify, and which to reinterpret for new audiences. Some designers retain classic silhouettes but use modern textiles. Others reduce visual complexity so garments can be worn more easily in everyday settings. Still others borrow structural cues such as wrapped fronts, ribbon closures, or sleeve volume while building entirely contemporary outfits. The result is a spectrum rather than a single category.`,
          `One major trend in modern Hanbok is portability. Designers know that many customers admire traditional dress but may not feel confident wearing full ceremonial Hanbok in everyday life. To address that, they create garments that keep a Hanbok sensibility while becoming easier to style with contemporary shoes, outerwear, or accessories. A simplified jeogori-inspired top, a dress shaped by Hanbok proportions, or a coat that references traditional lines can bring heritage into ordinary wardrobes without asking the wearer to commit to a fully formal silhouette. This makes Hanbok more visible in public life and less confined to special occasions.`,
          `Another trend is editorial richness. In fashion photography, music performance, tourism campaigns, and brand storytelling, modern Hanbok is often used to communicate elegance, narrative, and cultural confidence. In those settings, designers may exaggerate volume, play with unexpected color pairings, or combine historical references with cinematic styling. The goal is not always literal authenticity. Sometimes it is emotional continuity: keeping the spirit of Hanbok while making it legible to viewers accustomed to global fashion imagery. This is one reason Hanbok works so well in digital media. Its shapes read clearly, and its movement carries strong visual character even in a still image.`,
          `Material experimentation is also central. Traditional-looking silhouettes can feel entirely different depending on whether they are rendered in crisp silk-like textiles, matte cotton blends, translucent layers, or structured contemporary fabrics. Modern Hanbok often uses textile choice to shift mood. A garment can feel ceremonial, minimalist, youthful, or avant-garde without abandoning the core logic of Korean dress. That flexibility has helped Hanbok survive not by resisting change, but by absorbing it selectively. In design history, traditions remain relevant when they can be interpreted, not only preserved.`,
          `Social media has accelerated this process. Many users first encounter modern Hanbok through travel photos, influencer content, pop performances, or online rental platforms. These contexts reward visual clarity, recognizable silhouette, and photogenic detail. As a result, designers sometimes emphasize strong ribbons, bright skirts, floral surface decoration, or dramatic outerwear because those elements translate well in short-form visual media. At the same time, thoughtful brands are careful not to collapse Hanbok into mere costume spectacle. The most compelling modern Hanbok keeps one foot in heritage and one foot in contemporary use.`,
          `For platforms like HAMDEVA, modern Hanbok trends are especially relevant because digital try-on thrives on garments with clear identity. When the user sees a structured silhouette, meaningful color contrast, or distinctive surface detail, the generated image becomes more informative. The technology is strongest when the clothing itself is visually articulate. That means the modern Hanbok movement and AI fashion tools are not separate stories. Both are part of a wider effort to make cultural garments more accessible, more visible, and more understandable to modern audiences without erasing the traditions that made them important in the first place.`,
        ],
      },
      {
        slug: 'traditional-korean-clothing-around-the-world',
        title: 'Traditional Korean Clothing Around the World',
        description: 'How Hanbok travels through tourism, diaspora communities, museums, media, and international fashion.',
        paragraphs: [
          `Traditional Korean clothing now circulates far beyond the Korean peninsula. Hanbok appears in museums, embassy events, tourism campaigns, university cultural festivals, global fashion shoots, historical exhibitions, and online communities of people interested in East Asian dress. This international visibility reflects the wider global spread of Korean culture, but it also changes the conditions under which Hanbok is seen. A garment once understood mainly within a Korean social context is now interpreted by audiences with very different levels of background knowledge. That creates both opportunity and responsibility.`,
          `For diaspora communities, Hanbok can function as a bridge between generations. It may appear during weddings, holidays, family portraits, or language-school events as a visible expression of identity and continuity. In those contexts, Hanbok is not only beautiful clothing. It is a way of carrying memory, respect, and belonging. The emotional meaning of a garment can be especially strong when it appears outside its original cultural geography. Wearing Hanbok abroad can become a statement of connection, celebration, and intentional cultural visibility.`,
          `Museums and cultural institutions add another layer. When Hanbok is displayed in exhibitions, viewers often encounter it through curatorial framing that emphasizes craftsmanship, historical context, or social symbolism. This can be valuable, but museum display also has limits. Garments behind glass cannot move, and static labels can never fully communicate how clothing behaves on a body. That is why educational digital media and high-quality try-on visualization can complement institutional presentation. They help translate object-based heritage into a more lived visual understanding.`,
          `Tourism has also played a major role in globalizing Hanbok. Travelers visiting Korean palace districts frequently rent Hanbok for photographs, turning the garment into part of an experiential itinerary. This has helped normalize Hanbok as something that visitors can respectfully engage with, not only something they passively observe. Yet tourism can also oversimplify tradition if every garment is treated as interchangeable or purely decorative. Informational platforms help correct that by explaining differences in style, level of formality, and cultural use. Education makes appreciation deeper and more sustainable.`,
          `In global fashion media, Hanbok often appears as an inspiration source rather than a directly worn garment. Designers may borrow proportions, wrapped closures, sleeve volume, or layered color logic without reproducing a historical outfit. This can lead to exciting design dialogue, but it can also blur attribution if Korean sources are not clearly acknowledged. One role of content-rich fashion sites is therefore interpretive: they help audiences recognize what makes Hanbok distinct so that influence is seen more accurately rather than dissolved into vague “Asian” styling language.`,
          `Technology adds another international dimension. A visitor in London, São Paulo, Jakarta, or Toronto can learn about Hanbok online, compare articles, and test a virtual try-on without access to a local rental shop. That does not replace physical experience, but it lowers the barrier to informed curiosity. In that sense, digital fashion tools can widen participation. They make Korean clothing more discoverable while also making careful explanation more necessary. Global visibility only becomes meaningful when it is matched by context, respect, and enough information to turn surface interest into genuine understanding.`,
        ],
      },
      {
        slug: 'how-technology-is-changing-fashion',
        title: 'How Technology Is Changing Fashion',
        description: 'Why digital tools, AI imaging, and virtual presentation are changing how people discover clothing.',
        paragraphs: [
          `Technology has transformed fashion at almost every level, from design research and production planning to marketing, ecommerce, and customer decision-making. What used to happen mainly in studios and fitting rooms now often begins on a screen. People discover brands through social feeds, compare products via editorial content, and form opinions based on visual simulations long before they touch a fabric. This shift has changed not only how fashion is sold, but how it is imagined. Clothing now exists in physical, photographic, and digital representational forms all at once.`,
          `One of the biggest changes is the rise of visualization as a decision tool. High-quality images used to serve mostly promotional functions. Today they also serve as evaluation interfaces. Shoppers want to see how a garment drapes, how it might suit a certain body presence, how it behaves from different angles, and how it fits into a broader style narrative. This need has encouraged the growth of 3D product views, digital showrooms, AI-generated styling previews, and virtual try-on systems. Each of these tools attempts to reduce uncertainty in the gap between product image and lived wear.`,
          `For heritage fashion such as Hanbok, technology can be especially valuable because many users lack intuitive familiarity with the garment category. A shirt or blazer may be easy to imagine because it belongs to a widely shared visual vocabulary. Hanbok does not always enjoy that advantage, especially for international audiences. Technology helps by making comparison easier. A multi-angle AI try-on sheet can show how a ribbon falls, how a skirt volume reads, or how a robe shapes the body. The value is not only aesthetic. It is educational. Technology can make unfamiliar garments legible without flattening them into generic categories.`,
          `The challenge, of course, is that technology can also distort. Poor prompts, weak reference images, or careless platforms may invent details, simplify cultural garments, or misrepresent material qualities. That is why responsible fashion technology must combine interface design with editorial guidance. Users need to understand input quality, reference hierarchy, and output limits. A credible site does not promise magical accuracy. It offers informed experimentation. It explains what the system is doing, what kinds of results are realistic, and how to interpret the final image in context.`,
          `Another major shift is how technology connects content and commerce. A strong informational article can now lead directly into a styling exploration, product comparison, or AI preview. This blurs the line between editorial publishing and interactive service. For sites like HAMDEVA, that is a strength. The educational article teaches the user what to notice, and the digital tool translates those ideas into a visible outcome. Instead of treating content as filler around a tool, the site treats content as infrastructure for better use. That is the kind of integrated experience modern audiences increasingly expect.`,
          `In the future, technology will likely deepen rather than replace human fashion judgment. People will still care about taste, craftsmanship, comfort, and meaning. What will change is the quality of the preview environment that surrounds those decisions. The best systems will not simply generate pretty images. They will help users understand clothing more clearly, ask better questions, and move toward smarter choices. Fashion technology succeeds not when it overwhelms tradition, but when it makes tradition easier to see, compare, and appreciate.`,
        ],
      },
      {
        slug: 'virtual-try-on-and-the-future-of-clothing',
        title: 'Virtual Try-On and the Future of Clothing',
        description: 'Why single-call multi-angle try-on experiences are becoming a meaningful part of digital fashion.',
        paragraphs: [
          `Virtual try-on is often presented as a convenience feature, but its long-term impact could be much broader. At a basic level, it helps users imagine clothing on a person rather than on a hanger or isolated product card. At a deeper level, it changes how people interpret fashion information. Instead of reading a garment only as an object, users start reading it as a relationship between silhouette, body, movement, and identity. That relational view is especially important online, where uncertainty is one of the biggest barriers to confident decision-making.`,
          `The future of virtual try-on will likely depend on consistency as much as realism. A single beautiful image is not enough if it feels disconnected from the garment reference or changes the person too much. That is why multi-angle composite outputs matter. When one request produces a coordinated 1x4 sheet with front, angled, and back views, the user can judge the garment as a continuous design rather than as an isolated shot. This improves trust, because the output becomes more comparable to a lookbook or catalog presentation and less like an unpredictable one-off generation.`,
          `For cultural or structurally complex clothing, this matters even more. Hanbok, formalwear, robes, layered garments, and pet clothing all gain meaning from silhouette continuity across directions. A front image might show color and ribbon placement, but the back view may reveal whether the garment still looks coherent. Angled views may show where volume sits on the body. Virtual try-on becomes more useful when it helps users understand design logic rather than merely admire a surface image. The future of the field therefore lies in better layout discipline, stronger reference fidelity, and clearer educational framing.`,
          `There is also a sustainability angle. Better preview quality can reduce some forms of uncertainty-driven browsing and improve confidence before purchase or rental. It may not solve fashion waste on its own, but it can contribute to more thoughtful decisions by making visual fit and styling easier to assess earlier. For brands, this can mean better communication. For users, it can mean fewer surprises. For cultural garments, it can mean more respectful engagement because the clothing is presented with context instead of being reduced to spectacle.`,
          `The most promising future is not one where AI replaces fashion knowledge, but one where AI becomes part of a larger knowledge environment. A strong virtual try-on platform will combine articles, references, styling explanation, historical information, and carefully structured outputs. That combination gives users a richer experience and gives the technology a more credible role. HAMDEVA’s approach to Hanbok try-on reflects that principle. The AI tool remains important, but it works best when embedded within a content site that teaches users what they are looking at and why it matters.`,
          `As image models improve, the technical barrier to generation may fall, but the editorial challenge will become more important. Many sites will be able to make images. Fewer will be able to make meaningful images. The difference will come from prompt design, route stability, content depth, and respect for the garment being represented. In that sense, the future of clothing technology is not only about speed or realism. It is about whether the digital layer adds understanding. When it does, virtual try-on becomes more than a feature. It becomes a new way of reading fashion.`,
        ],
      },
    ],
  },
  about: {
    title: 'About HAMDEVA',
    description: 'Learn about HAMDEVA’s mission, technology vision, and why virtual fashion matters.',
    sections: [
      {
        heading: 'Mission',
        paragraphs: [
          `HAMDEVA exists to make Korean traditional fashion easier to understand, easier to explore, and easier to visualize in a digital environment. The project combines informative editorial content with AI-powered virtual try-on so that users can move from curiosity to visual experimentation in one place. The mission is not only to generate images. It is to support cultural appreciation, better decision-making, and more meaningful access to Hanbok for people who may not live near a rental shop, studio, or specialist retailer.`,
          `The website is built on the belief that heritage fashion deserves both context and usability. A user should be able to learn what Hanbok is, why its shape matters, how color carries meaning, and how modern interpretations differ from ceremonial forms. That same user should also be able to test a reference garment and see a realistic multi-angle output. HAMDEVA treats those as parts of one mission rather than two unrelated products.`,
        ],
      },
      {
        heading: 'Technology Vision',
        paragraphs: [
          `HAMDEVA’s technology vision is grounded in guided image generation rather than uncontrolled novelty. The system takes identity reference, garment reference, and structured output goals seriously. Instead of maximizing random variation, it aims for consistency: the same person, the same garment, and a clear fashion sheet that supports comparison. This approach is particularly useful for garments whose character depends on silhouette, layering, and decorative detail.`,
          `Over time, the long-term vision is to create better bridges between culture, content, and visualization. That means continuing to improve prompt design, routing stability, educational presentation, and user trust. The goal is not to treat AI as a black box. It is to build a clear user experience around it, where visitors understand what the system is for, what kinds of inputs work best, and how to interpret outputs responsibly.`,
        ],
      },
      {
        heading: 'Why Virtual Fashion Matters',
        paragraphs: [
          `Virtual fashion matters because people increasingly encounter clothing through screens before they ever touch it in person. That is true for global shoppers, travelers, cultural learners, and content creators alike. When done well, virtual fashion tools reduce uncertainty, improve communication, and make unfamiliar garments easier to understand. They can also create access for users who are curious but not yet ready to purchase, rent, or book an in-person fitting.`,
          `For HAMDEVA, the point is not to replace real garments, artisans, or cultural knowledge. The point is to support them by helping people arrive better informed. A digital try-on can encourage more thoughtful exploration, and an informational site can turn a quick visual experiment into a deeper engagement with Korean dress culture. That combination is why virtual fashion matters to this project.`,
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Read how HAMDEVA handles uploaded images, AI processing, and user privacy.',
    sections: [
      {
        heading: 'User Uploaded Images',
        paragraphs: [
          `HAMDEVA allows users to upload or select image references for AI virtual try-on generation. These images are used only for the operation of the service, including preview display, temporary processing, and generation of a try-on result. The site is designed so users can experiment with face references and clothing references without creating an account or building a permanent public profile.`,
          `Images provided by users should be chosen responsibly. Users must have the right to use the photos they upload, and they should avoid submitting content that violates privacy, copyright, or applicable law. HAMDEVA is intended for legitimate personal experimentation, cultural exploration, and informational use.`,
        ],
      },
      {
        heading: 'AI Processing',
        paragraphs: [
          `Uploaded images may be transmitted to external AI processing systems for the sole purpose of generating a virtual try-on result. This processing is necessary for the tool to function. The site may also store limited technical usage information, such as anonymous request counts, to support service limits, stability, and abuse prevention.`,
          `HAMDEVA does not describe AI output as a biometric identity system or a security tool. AI generation is interpretive and is used here to create a fashion visualization. Users should understand that generated images are simulated outputs based on the references they provide and are not exact records of how a real garment will behave in physical space.`,
        ],
      },
      {
        heading: 'Data Usage and Storage',
        paragraphs: [
          `HAMDEVA is designed with a minimal-storage approach. Personal photos are not intended to be permanently stored as a user archive for unrelated business purposes. Images are used to perform the requested generation flow and to return the result to the user. Local browser storage may be used for interface preferences, cached results, or usage counters so the site can remain responsive.`,
          `If technical logs or temporary processing data are created, they are used for service operation, debugging, rate control, and reliability. HAMDEVA’s goal is to minimize unnecessary retention of personal image data and to avoid turning uploaded photos into a long-term content repository.`,
        ],
      },
      {
        heading: 'No Permanent Storage of Personal Photos',
        paragraphs: [
          `HAMDEVA’s operating principle is that personal photos are submitted for immediate AI processing, not for permanent profile storage. Users should still exercise judgment and avoid uploading highly sensitive content. No service can guarantee absolute risk elimination on the modern internet, but HAMDEVA is structured to avoid unnecessary long-term retention of personal portraits as part of ordinary site use.`,
          `If the privacy policy is updated over time, the most recent version published on the site will govern current use. Continued use of the service after changes are published indicates acceptance of those revised terms.`,
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    description: 'Review the terms that govern the use of HAMDEVA, including content restrictions and AI image disclaimers.',
    sections: [
      {
        heading: 'User Responsibility',
        paragraphs: [
          `By using HAMDEVA, users agree to submit only content they have the legal right to use. This includes portrait photos, clothing images, and any material used to generate a virtual try-on result. Users are responsible for ensuring that uploaded content does not violate privacy rights, intellectual property rights, or applicable law.`,
          `Users also agree not to misuse the service for fraud, impersonation, harassment, defamation, unlawful surveillance, or deceptive commercial activity. HAMDEVA is intended for informational exploration, styling visualization, and lawful personal or editorial experimentation.`,
        ],
      },
      {
        heading: 'Content Restrictions',
        paragraphs: [
          `Users may not upload unlawful, exploitative, abusive, or harmful material. This includes content intended to deceive others about identity, manipulate political or financial decisions, or create unauthorized likenesses in violation of local law. Users should also avoid submitting confidential or highly sensitive personal material that is not necessary for a fashion try-on workflow.`,
          `HAMDEVA reserves the right to limit, reject, or block use that appears abusive, technically harmful, or inconsistent with the purpose of the service. Temporary access limits and generation quotas may be used to preserve service quality and fairness.`,
        ],
      },
      {
        heading: 'Copyright and Intellectual Property',
        paragraphs: [
          `Users retain responsibility for the source images they upload. HAMDEVA does not grant users rights they do not already possess. If a garment image, portrait, or branded asset belongs to another party, the user must ensure they have appropriate permission before using it through the service.`,
          `The HAMDEVA website, brand presentation, editorial content, and service design may be protected by copyright and related rights. Users may not copy or republish site content in a misleading or unauthorized way without permission.`,
        ],
      },
      {
        heading: 'AI Generated Image Disclaimer',
        paragraphs: [
          `Results created by HAMDEVA are AI-generated visualizations. They are intended to help users imagine clothing, compare silhouettes, and explore styling possibilities. They are not guarantees of exact physical fit, exact fabric behavior, or identical real-world appearance. Variations between generated output and actual garments, tailoring, lighting, and photography should be expected.`,
          `By using the service, users acknowledge that AI-generated images are interpretive outputs. HAMDEVA does not promise perfection, historical certification, or exact production matching. The tool should be used as a visual planning aid within a broader process of informed fashion decision-making.`,
        ],
      },
    ],
  },
  contact: {
    title: 'Contact HAMDEVA',
    description: 'Get in touch with HAMDEVA for support, partnership inquiries, or general questions.',
    sections: [
      {
        heading: 'Support and General Inquiries',
        paragraphs: [
          `HAMDEVA welcomes questions about the website, virtual try-on results, cultural content, and partnership opportunities. If you experience a technical issue, the fastest way to get useful help is to describe what you uploaded, what action you attempted, and what message or error appeared on screen. Clear details make it easier to reproduce and resolve problems.`,
          `For editorial inquiries, educational collaboration, or feedback about Hanbok-related content, you can also contact the team directly. HAMDEVA is built as both a tool and a content destination, so thoughtful suggestions about usability, historical explanations, or article topics are especially valuable.`,
        ],
      },
    ],
  },
};

export const SUPPORT_EMAIL = 'support@hamdeva.com';
