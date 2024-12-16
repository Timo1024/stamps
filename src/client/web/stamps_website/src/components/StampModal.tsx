import React, { useState, useEffect, useRef } from 'react';
import './StampModal.css';
import { log } from 'console';

interface StampModalProps {
    stamp: any;
    onClose: () => void;
    onSave: (updatedStamp: any) => void;
}

const StampModal: React.FC<StampModalProps> = ({ stamp, onClose, onSave }) => {
    const [note, setNote] = useState(stamp.note || '');
    const [image, setImage] = useState<File | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const [stampDetails, setStampDetails] = useState<{ [key: string]: string }>({});
    const [stampValuesAndOwnership, setStampValuesAndOwnership] = useState<{ [key: string]: [string | null, number | null, number | null] }>({});

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // prepare data to display
    useEffect(() => {

        console.log(stamp);
        
        // themes
        let themes: string = "-";
        if (stamp.themes) {
            try {                
                // Replace single quotes with double quotes and handle nested single quotes
                const parsedThemes = JSON.parse(stamp.themes.replace(/'/g, '"'));

                // split each element at / and keep unique values
                const uniqueThemes: Set<string> = new Set(parsedThemes.flatMap((theme: string) => theme.split('/')));
                // set to array
                const uniqueThemesArray: string[] = Array.from(uniqueThemes);

                themes = uniqueThemesArray.join(', ');
            } catch (error) {
                console.error('Error parsing themes:', error);
            }
        }

        // the last date the user added this stamp
        let lastAdded: string = "-";
        if (stamp.added_at) {
            const lastAddedRaw: string = stamp.added_at;
            // convert Sat, 07 Dec 2024 15:02:38 GMT to readable date
            const date = new Date(lastAddedRaw);
            lastAdded = date.toLocaleDateString();
            // if the date was today or yesterday, show the time instead
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastAdded === today.toLocaleDateString()) {
                lastAdded = "Today at " + date.toLocaleTimeString();
            } else if (lastAdded === yesterday.toLocaleDateString()) {
                lastAdded = "Yesterday at " + date.toLocaleTimeString();
            }
        }

        let dateOfIssue: string = "-";
        if (stamp.date_of_issue) {
            dateOfIssue = new Date(stamp.date_of_issue).toLocaleDateString();
        }

        //   create dict with all values needed in the stamp-details div
        const stampDetails = {
            "Country": stamp.country ? stamp.country : "-",
            "Year": stamp.year ? stamp.year : "-",
            "Denomination": stamp.denomination ? stamp.denomination : "-",
            "Themes": themes,
            "Last added": lastAdded,
            "Category": stamp.category ? stamp.category : "-",
            "Color": stamp.color ? stamp.color : "-",
            "Date of Issue": dateOfIssue,
            "Designed by": stamp.designed ? stamp.designed : "-",
            "Engraved by": stamp.engraved ? stamp.engraved : "-",
            "Size": stamp.height_width ? stamp.height_width : "-",
            "Number Issued": stamp.number_issued ? stamp.number_issued : "-",
            "Perforation": stamp.perforations ? stamp.perforations : "-",
            "Sheet Size": stamp.sheet_size ? stamp.sheet_size : "-" //,
            // "Stamps Issued": stamp.stamps_issued ? stamp.stamps_issued : "-"
        };

        const stampValuesAndOwnership : { [key: string]: [string | null, number | null, number | null] } = {
            "Mint": [stamp.mint_condition ? stamp.mint_condition : "-", stamp.amount_minted ? stamp.amount_minted : 0, stamp.mint_condition_float ? stamp.mint_condition_float : 0],
            "Unused": [stamp.unused ? stamp.unused : "-", stamp.amount_unused ? stamp.amount_unused : 0, stamp.unused_float ? stamp.unused_float : 0],
            "Used": [stamp.used ? stamp.used : "-", stamp.amount_used ? stamp.amount_used : 0, stamp.used_float ? stamp.used_float : 0],
            "Letter/FDC": [stamp.letter_fdc ? stamp.letter_fdc : "-", stamp.amount_letter_fdc ? stamp.amount_letter_fdc : 0, stamp.letter_fdc_float ? stamp.letter_fdc_float : 0]
        };

        setStampDetails(stampDetails);
        setStampValuesAndOwnership(stampValuesAndOwnership);

    }, [stamp]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Match the duration of the CSS transition
    };

    const handleImageLoad = () => {
        setIsImageLoaded(true);
    };

    const calculateTotalValue = () => {
        return Object.values(stampValuesAndOwnership).reduce((total, [_, amount, value]) => {
            return total + (amount || 0) * (value || 0);
        }, 0);
    };

    return (
        <div className={`stamp-modal-overlay ${isVisible ? 'visible' : ''}`}>
            <div className="stamp-modal" ref={modalRef}>
                <button className="close-button" onClick={handleClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M0.646447 0.646447C0.841709 0.451184 1.15829 0.451184 1.35355 0.646447L4 3.29289L6.64645 0.646447C6.84171 0.451184 7.15829 0.451184 7.35355 0.646447C7.54882 0.841709 7.54882 1.15829 7.35355 1.35355L4.70711 4L7.35355 6.64645C7.54882 6.84171 7.54882 7.15829 7.35355 7.35355C7.15829 7.54882 6.84171 7.54882 6.64645 7.35355L4 4.70711L1.35355 7.35355C1.15829 7.54882 0.841709 7.54882 0.646447 7.35355C0.451184 7.15829 0.451184 6.84171 0.646447 6.64645L3.29289 4L0.646447 1.35355C0.451184 1.15829 0.451184 0.841709 0.646447 0.646447Z" fill="#fff" />
                    </svg>
                </button>
                <div className="stamp-modal-content">
                    <h2>{stamp.set_name}</h2>
                    <div className="stamp-modal-image-container">
                        <img
                            src={`http://localhost:5000/images/${stamp.image_path.replace('./images_all_2/', '')}`}
                            alt={stamp.set_name}
                            className={`stamp-modal-image ${isImageLoaded ? 'loaded' : ''}`}
                            onLoad={handleImageLoad}
                        />
                    </div>
                    <div className="stamp-details">
                        {Object.keys(stampDetails).map((key) => (
                            <div key={key} className="stamp-detail">
                                <div className="stamp-detail-label">{key}</div>
                                <div className="stamp-detail-value">{stampDetails[key]}</div>
                            </div>
                        ))}
                    </div>
                    <div className="stamp-values-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Value</th>
                                    <th>Owned</th>
                                    <th>Total Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(stampValuesAndOwnership).map((key) => {
                                    const [value, amount, valueFloat] = stampValuesAndOwnership[key];
                                    const totalValue = (amount || 0) * (valueFloat || 0);
                                    return (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td>{value}</td>
                                            <td>{amount}</td>
                                            <td>{totalValue.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3}>Total</td>
                                    <td>{calculateTotalValue().toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StampModal;
