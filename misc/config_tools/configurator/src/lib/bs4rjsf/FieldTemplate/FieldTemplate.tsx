import React from "react";

import {FieldTemplateProps} from "@rjsf/core";

import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";

import WrapIfAdditional from "./WrapIfAdditional";
// @ts-ignore
import rst2html from "rst2html"
import {OverlayTrigger, Popover} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCircleExclamation} from "@fortawesome/free-solid-svg-icons";

const FieldTemplate = (
    {
        id,
        children,
        displayLabel,
        rawErrors = [],
        rawHelp,
        rawDescription,
        classNames,
        disabled,
        label,
        onDropPropertyClick,
        onKeyChange,
        readonly,
        required,
        schema
    }: FieldTemplateProps) => {


    let descWithChildren

    if (displayLabel && rawDescription) {
        descWithChildren = <div className="d-flex">
            <OverlayTrigger
                trigger={["hover", "focus"]}
                key="top"
                placement="top"
                overlay={
                    <Popover id={`popover-positioned-top`}>
                        <Popover.Body>
                            <Form.Text className={rawErrors.length > 0 ? "text-danger" : "text-muted"}
                                       dangerouslySetInnerHTML={{__html: rst2html(rawDescription)}}/>
                        </Popover.Body>
                    </Popover>
                }>
                <div className="mx-2 py-2 descInfoBtn">
                    <FontAwesomeIcon
                        icon={faCircleExclamation}
                        color={rawErrors.length > 0 ? "red" : ""}
                    />
                </div>
            </OverlayTrigger>
            <div className="w-100">
                {children}
            </div>
        </div>
    } else {
        descWithChildren = children
    }
    return (
        <WrapIfAdditional
            classNames={classNames}
            disabled={disabled}
            id={id}
            label={label}
            onDropPropertyClick={onDropPropertyClick}
            onKeyChange={onKeyChange}
            readonly={readonly}
            required={required}
            schema={schema}
        >
            <Form.Group>
                {descWithChildren}
                {rawErrors.length > 0 && (
                    <ListGroup as="ul">
                        {rawErrors.map((error: string) => {
                            return (
                                <ListGroup.Item as="li" key={error} className="border-0 m-0 p-0">
                                    <small className="m-0 text-danger">
                                        {error}
                                    </small>
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                )}
                {rawHelp && (
                    <Form.Text
                        className={rawErrors.length > 0 ? "text-danger" : "text-muted"}
                        id={id}>
                        {rawHelp}
                    </Form.Text>
                )}
            </Form.Group>
        </WrapIfAdditional>
    );
};

export default FieldTemplate;
