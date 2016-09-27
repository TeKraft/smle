
import { XmlService } from './XmlService';

export abstract class AbstractXmlService<T> extends XmlService<T> {
    serialize(description: T) {
        let serializer = new XMLSerializer();
        let document = this.encode(description);
        document = this.prettyPrint(document);
        return serializer.serializeToString(document);
    }

    deserialize(xml: string | Document): T {
        let document: Document;
        if (xml instanceof Document) {
            document = xml;
        } else if (typeof (xml) === 'string') {
            let deserializer = new DOMParser();
            document = deserializer.parseFromString(xml as string, 'application/xml');
        } else {
            return null;
        }
        return this.decode(document);
    }

    protected abstract decode(document: Document): T;

    protected abstract encode(object: T): Document;

    private prettyPrint(source: Document): Document {
        return source;
        // const stylesheet: Document = new DOMParser().parseFromString(
        //     `<xsl:stylesheet version="1.0"
        //                    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
        //     <xsl:output omit-xml-declaration="yes" indent="yes"/>
        //     <xsl:template match="node()|@*">
        //       <xsl:copy>
        //         <xsl:apply-templates select="node()|@*"/>
        //       </xsl:copy>
        //     </xsl:template>
        //   </xsl:stylesheet>`, 'application/xml');
        // let processor = new XSLTProcessor();
        // processor.importStylesheet(stylesheet);
        // return processor.transformToDocument(source);
    }
}
