package com.example.duwasa_fams.service;

import com.example.duwasa_fams.entity.FieldApplication;
import com.example.duwasa_fams.entity.PlacementLetter;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;

@Service
public class PlacementLetterPdfService {

    private static final String UPLOAD_DIR =
            "uploads/placement-letters/";

    public String generatePlacementLetter(
            PlacementLetter letter) {

        if (letter == null) {
            throw new RuntimeException(
                    "Placement letter cannot be null");
        }

        if (letter.getApplication() == null) {
            throw new RuntimeException(
                    "Placement letter has no application");
        }

        FieldApplication application =
                letter.getApplication();

        try {

            // Create upload directory
            Path uploadPath =
                    Paths.get(UPLOAD_DIR);

            Files.createDirectories(uploadPath);

            String fileName =
                    letter.getFileName();

            if (fileName == null ||
                    fileName.isBlank()) {

                fileName =
                        "placement-letter-"
                                + letter.getLetterId()
                                + ".pdf";
            }

            Path filePath =
                    uploadPath.resolve(fileName);

            Document document =
                    new Document(
                            PageSize.A4,
                            50,
                            50,
                            50,
                            50
                    );

            PdfWriter.getInstance(
                    document,
                    new FileOutputStream(
                            filePath.toFile()
                    )
            );

            document.open();

            // Fonts
            Font headerFont =
                    new Font(
                            Font.HELVETICA,
                            16,
                            Font.BOLD
                    );

            Font subHeaderFont =
                    new Font(
                            Font.HELVETICA,
                            11,
                            Font.BOLD
                    );

            Font normalFont =
                    new Font(
                            Font.HELVETICA,
                            11,
                            Font.NORMAL
                    );

            Font boldFont =
                    new Font(
                            Font.HELVETICA,
                            11,
                            Font.BOLD
                    );

            // DUWASA heading
            Paragraph title =
                    new Paragraph(
                            "DODOMA URBAN WATER SUPPLY " +
                                    "AND SANITATION AUTHORITY",
                            headerFont
                    );

            title.setAlignment(
                    Element.ALIGN_CENTER
            );

            document.add(title);

            Paragraph subtitle =
                    new Paragraph(
                            "DUWASA",
                            subHeaderFont
                    );

            subtitle.setAlignment(
                    Element.ALIGN_CENTER
            );

            document.add(subtitle);

            document.add(
                    new Paragraph(" ")
            );

            // Letter number
            Paragraph letterNumber =
                    new Paragraph(
                            "Ref: "
                                    + safe(
                                    letter.getLetterNumber()
                            ),
                            normalFont
                    );

            document.add(letterNumber);

            // Date
            String issueDate =
                    letter.getIssueDate() != null
                            ? letter.getIssueDate()
                            .format(
                                    DateTimeFormatter
                                            .ofPattern(
                                                    "dd/MM/yyyy"
                                            )
                            )
                            : "";

            Paragraph date =
                    new Paragraph(
                            "Date: "
                                    + issueDate,
                            normalFont
                    );

            document.add(date);

            document.add(
                    new Paragraph(" ")
            );

            // Subject
            Paragraph subject =
                    new Paragraph(
                            "RE: FIELD PRACTICAL " +
                                    "PLACEMENT",
                            boldFont
                    );

            subject.setAlignment(
                    Element.ALIGN_CENTER
            );

            document.add(subject);

            document.add(
                    new Paragraph(" ")
            );

            // Student information
            String studentName = "";

            if (application.getStudent() != null &&
                    application.getStudent().getUser() != null) {

                String firstName =
                        safe(
                                application
                                        .getStudent()
                                        .getUser()
                                        .getFname()
                        );

                String lastName =
                        safe(
                                application
                                        .getStudent()
                                        .getUser()
                                        .getLname()
                        );

                studentName =
                        (firstName + " " + lastName)
                                .trim();
            }

            String collegeName = "";
            String course = "";

            if (application.getStudent() != null) {

                collegeName =
                        safe(
                                application
                                        .getStudent()
                                        .getCollegeName()
                        );

                course =
                        safe(
                                application
                                        .getStudent()
                                        .getCourse()
                        );
            }

            Paragraph greeting =
                    new Paragraph(
                            "Dear Sir/Madam,",
                            normalFont
                    );

            document.add(greeting);

            document.add(
                    new Paragraph(" ")
            );

            String paragraphText =
                    "This letter serves to confirm that "
                            + studentName
                            + ", a student from "
                            + collegeName
                            + " pursuing "
                            + course
                            + ", has been accepted "
                            + "for field practical training "
                            + "at Dodoma Urban Water Supply "
                            + "and Sanitation Authority "
                            + "(DUWASA).";

            Paragraph body =
                    new Paragraph(
                            paragraphText,
                            normalFont
                    );

            body.setAlignment(
                    Element.ALIGN_JUSTIFIED
            );

            document.add(body);

            document.add(
                    new Paragraph(" ")
            );

            // Placement period
            String startDate =
                    application.getStartDate() != null
                            ? application.getStartDate()
                            .format(
                                    DateTimeFormatter
                                            .ofPattern(
                                                    "dd/MM/yyyy"
                                            )
                            )
                            : "";

            String endDate =
                    application.getEndDate() != null
                            ? application.getEndDate()
                            .format(
                                    DateTimeFormatter
                                            .ofPattern(
                                                    "dd/MM/yyyy"
                                            )
                            )
                            : "";

            String departmentName = "";

            if (application.getDepartment() != null) {
                departmentName =
                        safe(
                                application
                                        .getDepartment()
                                        .getDepartmentName()
                        );
            }

            Paragraph placementDetails =
                    new Paragraph(
                            "The field practical placement "
                                    + "will be undertaken in the "
                                    + departmentName
                                    + " Department from "
                                    + startDate
                                    + " to "
                                    + endDate
                                    + ".",
                            normalFont
                    );

            placementDetails.setAlignment(
                    Element.ALIGN_JUSTIFIED
            );

            document.add(
                    placementDetails
            );

            document.add(
                    new Paragraph(" ")
            );

            // Financial assistance statement
            Paragraph financial =
                    new Paragraph(
                            "Please note that DUWASA does not "
                                    + "provide financial assistance "
                                    + "to students undertaking "
                                    + "field practical training.",
                            normalFont
                    );

            financial.setAlignment(
                    Element.ALIGN_JUSTIFIED
            );

            document.add(financial);

            document.add(
                    new Paragraph(" ")
            );

            Paragraph regards =
                    new Paragraph(
                            "Yours faithfully,",
                            normalFont
                    );

            document.add(regards);

            document.add(
                    new Paragraph(" ")
            );

            document.add(
                    new Paragraph(" ")
            );

            Paragraph signature =
                    new Paragraph(
                            "____________________________",
                            normalFont
                    );

            document.add(signature);

            Paragraph managingDirector =
                    new Paragraph(
                            "MANAGING DIRECTOR",
                            boldFont
                    );

            document.add(managingDirector);

            Paragraph duwasa =
                    new Paragraph(
                            "DUWASA",
                            boldFont
                    );

            document.add(duwasa);

            document.add(
                    new Paragraph(" ")
            );

            Paragraph copy =
                    new Paragraph(
                            "Copy: Student",
                            normalFont
                    );

            document.add(copy);

            document.close();

            return filePath.toString();

        } catch (DocumentException |
                 IOException e) {

            throw new RuntimeException(
                    "Failed to generate placement letter PDF",
                    e
            );
        }
    }

    private String safe(String value) {

        return value == null
                ? ""
                : value;
    }
}