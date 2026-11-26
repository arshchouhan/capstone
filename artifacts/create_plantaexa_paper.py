from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.section import WD_ORIENT
from pathlib import Path

OUT = Path(r"E:\Capstone\artifacts\Plantaexa_IEEE_Research_Paper.docx")
OUT.parent.mkdir(parents=True, exist_ok=True)

doc = Document()
sec = doc.sections[0]
sec.top_margin = Inches(0.55)
sec.bottom_margin = Inches(0.55)
sec.left_margin = Inches(0.62)
sec.right_margin = Inches(0.62)

def set_font(run, size=10, bold=False, italic=False, color=None):
    run.font.name = 'Times New Roman'
    run._element.rPr.rFonts.set(qn('w:ascii'), 'Times New Roman')
    run._element.rPr.rFonts.set(qn('w:hAnsi'), 'Times New Roman')
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = RGBColor(*color)

styles = doc.styles
styles['Normal'].font.name = 'Times New Roman'
styles['Normal']._element.rPr.rFonts.set(qn('w:ascii'), 'Times New Roman')
styles['Normal']._element.rPr.rFonts.set(qn('w:hAnsi'), 'Times New Roman')
styles['Normal'].font.size = Pt(10)
styles['Normal'].paragraph_format.space_after = Pt(3)
styles['Normal'].paragraph_format.line_spacing = 1.0

for style_name, size in [('Title', 18), ('Heading 1', 10), ('Heading 2', 10)]:
    style = styles[style_name]
    style.font.name = 'Times New Roman'
    style._element.rPr.rFonts.set(qn('w:ascii'), 'Times New Roman')
    style._element.rPr.rFonts.set(qn('w:hAnsi'), 'Times New Roman')
    style.font.size = Pt(size)
    style.font.bold = True
    style.font.color.rgb = RGBColor(0,0,0)

styles['Heading 1'].paragraph_format.space_before = Pt(8)
styles['Heading 1'].paragraph_format.space_after = Pt(3)
styles['Heading 2'].paragraph_format.space_before = Pt(5)
styles['Heading 2'].paragraph_format.space_after = Pt(2)

def set_columns(section, count=2, space=0.22):
    sectPr = section._sectPr
    cols = sectPr.first_child_found_in('w:cols')
    if cols is None:
        cols = OxmlElement('w:cols')
        sectPr.append(cols)
    cols.set(qn('w:num'), str(count))
    cols.set(qn('w:space'), str(int(space * 1440)))

def set_cell_shading(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:fill'), fill)
    tcPr.append(shd)

def set_cell_border(cell, **kwargs):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = tcPr.first_child_found_in('w:tcBorders')
    if tcBorders is None:
        tcBorders = OxmlElement('w:tcBorders')
        tcPr.append(tcBorders)
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        if edge in kwargs:
            edge_data = kwargs[edge]
            tag = 'w:{}'.format(edge)
            element = tcBorders.find(qn(tag))
            if element is None:
                element = OxmlElement(tag)
                tcBorders.append(element)
            for key in ['val', 'sz', 'space', 'color']:
                if key in edge_data:
                    element.set(qn('w:{}'.format(key)), str(edge_data[key]))

def format_table(table, header=True):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'
    for ridx, row in enumerate(table.rows):
        for cell in row.cells:
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_border(cell, top={'val':'single','sz':'4','color':'D9D9D9'}, bottom={'val':'single','sz':'4','color':'D9D9D9'}, left={'val':'single','sz':'4','color':'D9D9D9'}, right={'val':'single','sz':'4','color':'D9D9D9'})
            if header and ridx == 0:
                set_cell_shading(cell, '1F4E79')
            elif ridx % 2 == 0:
                set_cell_shading(cell, 'F3F7FA')
            for p in cell.paragraphs:
                p.paragraph_format.space_after = Pt(1)
                for r in p.runs:
                    set_font(r, 8.2, bold=(header and ridx == 0), color=(255,255,255) if header and ridx == 0 else None)

def add_text(text='', bold_prefix=None, indent=0, after=3, align=None):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(indent)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = 1.0
    if align is not None:
        p.alignment = align
    if bold_prefix and text.startswith(bold_prefix):
        r = p.add_run(bold_prefix)
        set_font(r, 10, bold=True)
        r = p.add_run(text[len(bold_prefix):])
        set_font(r, 10)
    else:
        r = p.add_run(text)
        set_font(r, 10)
    return p

def add_section_heading(text):
    p = doc.add_paragraph()
    p.style = 'Heading 1'
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text.upper())
    set_font(r, 10, bold=True)
    return p

def add_subheading(text):
    p = doc.add_paragraph()
    p.style = 'Heading 2'
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    set_font(r, 10, bold=True, italic=True)
    return p

def add_bullet(text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.left_indent = Inches(0.18)
    p.paragraph_format.first_line_indent = Inches(-0.12)
    p.paragraph_format.space_after = Pt(1)
    r = p.add_run(text)
    set_font(r, 9.4)
    return p

def add_page_number(paragraph):
    run = paragraph.add_run()
    fldChar1 = OxmlElement('w:fldChar'); fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText'); instrText.set(qn('xml:space'), 'preserve'); instrText.text = 'PAGE'
    fldChar2 = OxmlElement('w:fldChar'); fldChar2.set(qn('w:fldCharType'), 'end')
    run._r.append(fldChar1); run._r.append(instrText); run._r.append(fldChar2)
    set_font(run, 8)

# Title block
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(7)
r = p.add_run('Plantaexa: A Privacy-Aware Full-Stack Platform for Local Plant Disease Screening, Care Orchestration, and Expert Discovery')
set_font(r, 18)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(1)
r = p.add_run('Arsh Chouhan')
set_font(r, 11)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(9)
r = p.add_run('Capstone Project, Plantaexa')
set_font(r, 10, italic=True)

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(4)
r = p.add_run('Abstract—')
set_font(r, 9.4, bold=True)
r = p.add_run('Plant disease applications often stop at image classification and leave the grower without a coherent path to monitoring, follow-up, local support, or safe product discovery. Plantaexa is a full-stack web platform that integrates a local 39-class Keras plant-disease classifier, privacy-scoped photo handling, result validation, care and recovery workflows, a scan-grounded assistant, expert communication, local plant-care discovery, and a model-aware marketplace. The deployed analysis path routes a private image from an Express service to a loopback Python adapter, which performs input-quality checks, exact matching for bundled reference images, image resizing to 160 × 160 pixels, model inference, and ambiguity gating before structured results are persisted. The platform avoids treating an ambiguous closed-set prediction as a diagnosis; it returns a review state when multiple model outputs are active. This paper documents the system design, supported classes, operational workflow, novelty, limitations, and planned mobile-camera-to-laptop capture pipeline. The novelty is system-level: it joins local inference, safety-oriented decision gating, longitudinal care data, and human escalation in one usable workflow rather than claiming a new neural architecture.')
set_font(r, 9.4)

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(8)
r = p.add_run('Index Terms—')
set_font(r, 9.2, bold=True)
r = p.add_run('plant disease classification, precision agriculture, local inference, computer vision, care scheduling, expert discovery, React, Express, MongoDB.')
set_font(r, 9.2, italic=True)

# Two-column body
body_sec = doc.add_section(WD_SECTION.CONTINUOUS)
body_sec.top_margin = Inches(0.55); body_sec.bottom_margin = Inches(0.55)
body_sec.left_margin = Inches(0.62); body_sec.right_margin = Inches(0.62)
set_columns(body_sec, 2)

footer = doc.sections[0].footer
fp = footer.paragraphs[0]
fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
add_page_number(fp)

add_section_heading('I. INTRODUCTION')
add_text('Plant disease screening from a leaf image is valuable only when the result is presented with appropriate uncertainty and is connected to practical follow-up. Public datasets such as PlantVillage enabled image-based classification research at scale [1], but controlled leaf imagery and closed class sets do not eliminate the need for image-quality checks, expert review, and field-aware care decisions. Plantaexa addresses this gap as an application platform rather than a stand-alone classifier.')
add_text('The system is designed for growers and plant-care specialists. A grower can capture or upload up to three photos, submit a scan, view a structured analysis, save or register the result, track recovery and care tasks, ask scan-specific questions, discover nearby public plant-care services, and browse external product search results. A specialist can manage connections, receive messages and meeting requests, and schedule consultations through an optional Google Calendar integration. All protected data are scoped to the authenticated user.')
add_text('This work contributes: (i) a local adapter pattern that isolates Keras inference from the web API, (ii) result-level safeguards that reject non-leaf imagery and withhold ambiguous predictions, (iii) a persistent scan-to-care-to-expert workflow, and (iv) a model-aware discovery and marketplace layer that uses the supported crop classes without converting merchant links into medical or agricultural treatment claims.')

add_section_heading('II. RELATED WORK AND DESIGN MOTIVATION')
add_text('PlantVillage released more than 50,000 curated healthy and diseased leaf images [1]. Mohanty et al. demonstrated deep-learning-based disease recognition across 14 crop species and 26 diseases or absence-of-disease categories [2]. Residual neural networks are a standard family for deep visual recognition because residual connections make deeper optimization more tractable [3]. These results motivate image-based crop screening, but they do not by themselves provide a safe user journey for unknown plants, blurred images, new diseases, or conflicting predictions.')
add_text('Plantaexa therefore treats a model output as a photo-based screening signal. The system distinguishes between usable and unusable images, healthy and care-needed results, and ambiguous outputs. It also preserves the result history and places escalation pathways next to the diagnosis. This avoids presenting a single confidence value as a definitive plant-health decision.')

add_section_heading('III. SYSTEM ARCHITECTURE')
add_text('Figuratively, the platform is organised as a browser client, a protected application API, specialised local services, and persistent data services. The React 19 and Vite client renders grower and specialist portals. The Express 5 API provides authentication, feature routes, validation, and user ownership controls. Mongoose models persist users, plants, scans, photos, care tasks, recovery observations, light readings, treatment plans, chat messages, experts, appointments, carts, notifications, and preferences.')

add_subheading('A. Architecture layers')
add_text('The client layer contains React portals for scans, recovery, care, community, experts, products, and role-specific workflows. The API layer applies Express routing, signed-in ownership checks, private media validation, controllers, and response shaping. The local AI layer is a loopback Python HTTP service that loads the Keras model, checks photo quality, and returns structured predictions. The data layer uses MongoDB/Mongoose for plant history, care, conversations, appointments, and preferences. The integration layer connects Geoapify/OpenStreetMap, optional Google Calendar/Meet, eBay Browse, and external merchant searches.')

add_subheading('B. Privacy and data boundaries')
add_text('Uploaded image paths are validated against a private naming convention before the backend reads them. The Python AI adapter binds only to 127.0.0.1, so it is not directly exposed to a browser. The application API is the public boundary and passes only the necessary base64 image payload to the loopback model service. This arrangement keeps local photos under backend control while allowing the web stack to use a stable JSON response contract.')

add_subheading('C. Scan and recovery workflow')
add_text('A scan is created in a processing state, receives the structured inference result, and is then marked complete or failed. When a scan is linked to a registered plant, the backend updates the plant’s latest-scan pointer and records care-task completion counts. The frontend offers saved scan review, unregistered-scan management, diagnosis history, recovery observations, care scheduling, and a scan workspace. The workspace separates the original image and finding region from explanatory cards, care requirements, crop information, botany discovery, and a scan-grounded conversation.')

add_section_heading('IV. ARTIFICIAL INTELLIGENCE PIPELINE')
add_subheading('A. Primary deployed model')
add_text('The primary provider is selected when AI_MODEL_PROVIDER is team-resnet. The supplied team repository describes the patched_model.keras artifact as a ResNet50 classifier trained for 39 PlantVillage labels across 14 crops [4]. Its configuration fixes the image input size at 160 × 160 RGB pixels and enumerates the classes. The current adapter loads this Keras artifact with TensorFlow, resizes using Lanczos resampling, creates a batch of one, and returns the top three values. Keras supports the .keras whole-model format used by the artifact [5].')
add_text('The deployed source contains legacy names that refer to EfficientNetB4 in some user-facing service messages, while the model repository configuration and README identify the bundled artifact as ResNet50. This paper consequently calls it the “team 39-class Keras classifier (repository-reported ResNet50)” and does not claim an independently verified architecture. Before external publication, the model summary, training script, dataset split, metrics, and version hash should be exported from the training environment.')

add_subheading('B. Supported classes')
add_text('The class inventory covers Apple (scab, black rot, cedar apple rust, healthy), Blueberry (healthy), Cherry (powdery mildew, healthy), Corn (Cercospora/gray leaf spot, common rust, northern leaf blight, healthy), Grape (black rot, Esca, leaf blight, healthy), Orange (citrus greening), Peach (bacterial spot, healthy), bell pepper (bacterial spot, healthy), Potato (early and late blight, healthy), Raspberry (healthy), Soybean (healthy), Squash (powdery mildew), Strawberry (leaf scorch, healthy), and Tomato (bacterial spot, early/late blight, leaf mold, Septoria leaf spot, spider mites, target spot, yellow leaf curl virus, mosaic virus, healthy).')

add_subheading('C. Safety-oriented inference gates')
add_text('The adapter first calculates simple colour and brightness statistics after downsampling a candidate image to 160 × 160. It rejects obvious screenshots and documents when the image lacks sufficient bright, leaf-green, or leaf-brown content. For unchanged bundled PlantDoc test files, SHA-256 matching returns a known mapped label rather than presenting a potentially unrelated classifier output. For other usable images, the adapter checks the 39 sigmoid scores. If more than one output is at or above 0.5, the system returns an unreliable state rather than taking an arbitrary argmax. The UI then asks for a clearer close-up and avoids assigning a treatment. This is a practical safeguard against the supplied artifact’s multi-active output behaviour.')

add_subheading('D. Optional model paths')
add_text('The backend retains two non-default alternatives. A local Transformers.js image-classification path can run Xenova/vit-base-patch16-224 without hosted inference credits. A hosted Hugging Face path can use configurable plant and disease models when a token is available. These paths normalize their predictions into the same scan result schema. They are not the default deployed route; their inclusion provides a controlled fallback and comparative evaluation path rather than a claim that all models are simultaneously used for one prediction.')

add_section_heading('V. RESULT INTERPRETATION AND USER EXPERIENCE')
add_text('The result schema contains plant name, scientific label where available, type, confidence, status, health score, findings, treatment notes, summary, and care requirements. A healthy classification produces a healthy status. A disease classification produces a care-needed status and adds an approximate finding region for interface explanation only; it is not object detection or segmentation. A zero-confidence unusable or ambiguous result is visibly represented as “Needs better photo” or “Needs review.”')
add_text('The scan assistant does not claim a free-form diagnosis. It builds responses from the saved scan’s summary, finding, confidence, treatment, light, watering, and soil data. It provides structured answers for explanation, care checklists, pest checks, photo retakes, and expert questions. This grounding prevents a scan conversation from silently replacing the underlying stored result with unrelated chat content.')

add_section_heading('VI. EXPERT DISCOVERY, SCHEDULING, AND MARKETPLACE')
add_text('Plantaexa maintains separate grower and specialist portal experiences. Growers can browse platform experts, initiate chat, request a Google Meet, and select consultation times. Specialists manage connections and can accept or reject requests. When configured, Google Calendar event scopes are used to create consultation invitations and shared Meet links; refresh tokens are encrypted with AES-256-GCM at rest by the application. These integrations remain optional because they require developer-owned OAuth configuration and consent.')
add_text('For public plant-care discovery, the backend queries Geoapify Places with a user-approved location, a 100 km search radius, proximity ranking, and several plant-care terms such as nursery, garden, seed, fertilizer, agriculture, and florist. The service deduplicates provider records and displays an address, contact information where available, opening hours, website, source, and map directions. Geoapify supports location- and category-based place queries and uses OpenStreetMap-derived records [6]. The system explicitly labels these as public listings rather than vetted Plantaexa experts.')
add_text('The market page reads the classifier’s crop inventory to expose crop filters. It produces disease-relevant external merchant search links as a safe baseline. When eBay Browse credentials are configured, the backend can retrieve live item titles, images, prices, seller information, and product links. The system does not recommend a product as a substitute for diagnosis and asks users to verify labels, local registration, and suitability before purchasing.')

add_section_heading('VII. NOVELTY')
add_text('The principal novelty is not a new convolutional architecture or a new training dataset. Instead, Plantaexa contributes an integrated workflow that operationalises an existing crop-disease classifier in a safer, more complete plant-care product. Its distinguishing features are:')
add_bullet('Local adapter isolation: the browser does not access model weights or directly expose private uploaded images to a hosted inference endpoint.')
add_bullet('Decision gating: input-quality screening, byte-identical reference recognition, and conflicting-output suppression prevent the interface from over-reporting a disease.')
add_bullet('Longitudinal actionability: a scan result is connected to recovery history, care tasks, observations, and a plant-specific record rather than ending at a label.')
add_bullet('Human escalation at the point of need: the diagnosis view includes platform experts, public plant-care discovery, appointment requests, messages, and calendar-aware consultations.')
add_bullet('Model-aware utility layers: crop filters and merchant searches derive from the actual supported label inventory, reducing mismatch between model coverage and marketplace language.')

add_section_heading('VIII. EVALUATION PLAN')
add_text('The current repository provides unit tests for core schemas, ownership, authentication, recurrence calculations, and demo flows. It does not yet contain a reproducible held-out accuracy, precision, recall, F1-score, confusion matrix, calibration curve, or field-photo benchmark for the packaged Keras model. Accordingly, no quantitative disease-detection claim is made in this paper.')
add_text('A complete evaluation should separate: (1) reference-image correctness on bundled PlantDoc files, (2) per-class classification performance on an unseen and versioned test split, (3) input-quality rejection precision and recall, (4) ambiguous-output rate, (5) latency from upload to response, (6) usability of recovery and expert-escalation flows, and (7) success rate for mobile-camera handoff. A field-photo dataset with realistic lighting, backgrounds, multiple leaves, pests, and non-plant images is essential because controlled leaf imagery can introduce shortcuts and background bias [7].')

add_section_heading('IX. LIMITATIONS AND ETHICAL CONSIDERATIONS')
add_text('The classifier is closed-set: an image resembling an unsupported plant or condition can still receive a misleading class if it passes the basic image check. The approximate highlighted region is an interface aid, not a localised lesion measurement. Treatment text is sourced from a CSV matching process and must not replace local agricultural guidance, crop-label instructions, or an expert assessment. Public directory results can be sparse, incomplete, or incorrectly categorised in source maps. Merchant links are discovery aids, not endorsements.')
add_text('The platform should clearly retain uncertainty language, allow users to delete scans, minimize stored image retention, encrypt third-party credentials, and distinguish public listings from verified specialists. Any production rollout should add rate limits, secure session storage, audit logging, data retention settings, consent text, and monitoring for prediction drift and failed integrations.')

add_section_heading('X. FUTURE SCOPE')
add_text('The next planned feature is a mobile-camera capture bridge. A laptop will display a one-time QR code that opens a local phone capture page when both devices are on the same Wi-Fi. The phone will provide a camera feed and submit selected frames or photos to the laptop’s private scan workflow. The existing camera gateway already supports a constrained phone-to-laptop photo transfer path; live streaming needs a secure browser context and should therefore use HTTPS or a locally trusted certificate. The future interface should show a live preview on the laptop, capture high-resolution stills on the phone, score focus and exposure before upload, and preserve the same private media boundary used by the present scan API.')
add_text('Model work should include architecture verification, reproducible training notebooks, class-balanced evaluation, probability calibration, multiclass softmax or validated thresholding, open-set/unknown detection, lesion segmentation, and active-learning review of uncertain field samples. Platform work should add offline-first capture, multilingual guidance, location-aware disease seasonality, agronomist verification, structured treatment safety checks, and outcome-based recovery analytics.')

add_section_heading('XI. CONCLUSION')
add_text('Plantaexa demonstrates how a plant-disease model can become a responsible end-to-end product workflow. It preserves a local inference boundary, turns uncertain classifications into review states, links results to care and recovery records, and offers clear routes to human help and relevant discovery. The project is best understood as a system integration contribution: it makes model output actionable while explicitly preserving its limitations. Future work should validate the classifier rigorously on field imagery and complete the secure mobile-camera-to-laptop capture experience.')

add_section_heading('REFERENCES')
references = [
    '[1] D. P. Hughes and M. Salathe, “An Open Access Repository of Images on Plant Health to Enable the Development of Mobile Disease Diagnostics,” arXiv:1511.08060, 2015.',
    '[2] S. P. Mohanty, D. P. Hughes, and M. Salathe, “Using Deep Learning for Image-Based Plant Disease Detection,” Frontiers in Plant Science, vol. 7, 2016.',
    '[3] K. He, X. Zhang, S. Ren, and J. Sun, “Deep Residual Learning for Image Recognition,” in Proc. CVPR, 2016, pp. 770–778.',
    '[4] Plantaexa AI Source Repository, “Plantaexa Plant Disease Recognition Chatbot,” local project source, accessed Nov. 2026.',
    '[5] TensorFlow, “Save, serialize, and export models,” TensorFlow Core documentation. [Online]. Available: https://www.tensorflow.org/guide/keras/serialization_and_saving',
    '[6] Geoapify, “Places API Documentation,” 2026. [Online]. Available: https://apidocs.geoapify.com/docs/places/',
    '[7] C. J. B. et al., “Uncovering Bias in the PlantVillage Dataset,” arXiv:2206.04374, 2022.',
    '[8] eBay Developers Program, “Browse API,” 2026. [Online]. Available: https://developer.ebay.com/api-docs/buy/static/api-browse.html',
    '[9] Plantaexa Backend, local implementation sources: ai_service/plant_disease_server.py, services/teamPlantModelService.js, services/scanChatService.js, and services/botanistDirectoryService.js, accessed Nov. 2026.'
]
for ref in references:
    p=doc.add_paragraph()
    p.paragraph_format.left_indent=Inches(0.16)
    p.paragraph_format.first_line_indent=Inches(-0.16)
    p.paragraph_format.space_after=Pt(2)
    r=p.add_run(ref); set_font(r,8.5)

# Basic core metadata
doc.core_properties.title = 'Plantaexa Research Paper'
doc.core_properties.author = 'Arsh Chouhan'
doc.core_properties.subject = 'IEEE-style project research paper'
doc.core_properties.comments = 'Generated from the Plantaexa implementation.'
doc.save(OUT)
print(OUT)
