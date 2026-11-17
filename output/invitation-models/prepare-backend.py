from pathlib import Path
import json,hashlib,difflib
root=Path('../Mariageplus-main').resolve(); changes=[]
def change(path, transform):
 p=root/path; before=p.read_text(encoding='utf-8') if p.exists() else ''; after=transform(before)
 assert after!=before,path
 changes.append({'path':path,'sha256':hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None,'content':after})
def insert(s,needle,text):
 assert needle in s,needle
 return s.replace(needle,text+needle,1)
base='src/main/java/com/mariageplus/'
field='    private String invitationCardTemplate;\n\n'
for file in ['dto/event/CreateEventRequest.java','dto/event/UpdateEventRequest.java']:
 change(base+file,lambda s:insert(s,'    private LocalDate eventDate;', '    @Pattern(regexp = "STANDARD|ROMANCE|PRESTIGE", message = "Modèle de carte invalide")\n'+field))
for file,needle in [('dto/event/EventResponse.java','    private LocalDate eventDate;'),('dto/invitation/PublicInvitationResponse.java','    private String guestFirstName;')]:
 change(base+file,lambda s,n=needle:insert(s,n,field))
change(base+'entity/Event.java',lambda s:insert(s,'    @Column(name = "event_date")', '''    @Builder.Default
    @Column(name = "invitation_card_template", nullable = false, length = 20)
    private String invitationCardTemplate = "STANDARD";

'''))
change(base+'service/EventService.java',lambda s:insert(insert(s,'                .message(request.getMessage())','                .invitationCardTemplate(request.getInvitationCardTemplate() == null ? "STANDARD" : request.getInvitationCardTemplate())\n'),'        if (request.getName() != null)', '        if (request.getInvitationCardTemplate() != null) event.setInvitationCardTemplate(request.getInvitationCardTemplate());\n'))
change(base+'service/RsvpService.java',lambda s:insert(s,'        return PublicInvitationResponse.builder()','') .replace('        return PublicInvitationResponse.builder()','        return PublicInvitationResponse.builder()\n                .invitationCardTemplate(event != null && event.getInvitationCardTemplate() != null ? event.getInvitationCardTemplate() : "STANDARD")',1))
change('src/main/resources/db/migration/V49__invitation_card_template.sql',lambda _:'''ALTER TABLE events ADD COLUMN invitation_card_template VARCHAR(20) NOT NULL DEFAULT 'STANDARD';
ALTER TABLE events ADD CONSTRAINT chk_event_invitation_card_template CHECK (invitation_card_template IN ('STANDARD', 'ROMANCE', 'PRESTIGE'));
''')
# Public read contract: event-specific choice reaches an unauthenticated guest.
change('src/test/java/com/mariageplus/service/RsvpServiceTest.java',lambda s:insert(s,'    @Test\n    void getPublicPage_', '''    @Test
    void publicInvitation_exposesEventCardTemplate() {
        stubGuestAndInvitation();
        when(eventRepository.findById(1L)).thenReturn(Optional.of(Event.builder()
                .name("Reception").invitationCardTemplate("PRESTIGE").build()));
        assertEquals("PRESTIGE", rsvpService.getPublicInvitation("tok").getInvitationCardTemplate());
    }

    @Test
    void publicInvitation_usesStandardForMissingEvent() {
        stubGuestAndInvitation();
        assertEquals("STANDARD", rsvpService.getPublicInvitation("tok").getInvitationCardTemplate());
    }

'''))
change('src/test/java/com/mariageplus/dto/InvitationCardTemplateTest.java',lambda _:'''package com.mariageplus.dto;

import com.mariageplus.dto.event.UpdateEventRequest;
import com.mariageplus.dto.event.CreateEventRequest;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class InvitationCardTemplateTest {
    @Test
    void validatesTemplateWithoutBreakingPartialUpdates() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            var request = new UpdateEventRequest();
            assertTrue(validator.validateProperty(request, "invitationCardTemplate").isEmpty());
            for (String template : new String[]{"STANDARD", "ROMANCE", "PRESTIGE"}) {
                request.setInvitationCardTemplate(template);
                assertTrue(validator.validateProperty(request, "invitationCardTemplate").isEmpty());
            }
            request.setInvitationCardTemplate("UNKNOWN");
            assertFalse(validator.validateProperty(request, "invitationCardTemplate").isEmpty());
            var creation = new CreateEventRequest();
            creation.setInvitationCardTemplate("UNKNOWN");
            assertFalse(validator.validateProperty(creation, "invitationCardTemplate").isEmpty());
        }
    }
}
''')
Path('output/invitation-models/backend-changes.json').write_text(json.dumps({'root':str(root),'changes':changes},ensure_ascii=False,indent=2),encoding='utf-8')
diff=''
for entry in changes:
 p=root/entry['path']; before=p.read_text(encoding='utf-8') if p.exists() else ''
 diff+=''.join(difflib.unified_diff(before.splitlines(True),entry['content'].splitlines(True),fromfile='a/'+entry['path'],tofile='b/'+entry['path']))
Path('output/invitation-models/backend.patch').write_text(diff,encoding='utf-8')
print(f'{len(changes)} backend files prepared for review')
