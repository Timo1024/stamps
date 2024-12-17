import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './StampModal.css';

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
    const [isEditing, setIsEditing] = useState(false);
    const [relatedImages, setRelatedImages] = useState<{ [id: number]: string }>({});
    const [loading, setLoading] = useState(true);
    const modalRef = useRef<HTMLDivElement>(null);
    const [stampDetails, setStampDetails] = useState<{ [key: string]: string }>({});
    const [stampValuesAndOwnership, setStampValuesAndOwnership] = useState<{ [key: string]: [string | null, number | null, number | null] }>({});

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Fetch related images
    useEffect(() => {
        const fetchRelatedImages = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/stamps/set/${stamp.set_id}`);
                const stampIds = response.data;
                // get the paths like this
                // http://localhost:5000/api/stamps/get_image_link/${id}
                const imageUrls: string[] = await Promise.all(stampIds.map(async (id: number) => {
                    const imageResponse = await axios.get(`http://localhost:5000/api/stamps/get_image_link/${id}`);
                    return imageResponse.data;
                }
                ));
                const imageUrlsDict: { [id: number]: string } = stampIds.reduce((acc: { [id: number]: string }, id: number, index: number) => {
                    acc[id] = imageUrls[index];
                    return acc;
                }, {});
                console.log(imageUrlsDict);
                setRelatedImages(imageUrlsDict);
            } catch (error) {
                console.error('Error fetching related images:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelatedImages();
    }, [stamp.set_id]);

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
            // "Last added": lastAdded,
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

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSaveClick = () => {
        setIsEditing(false);
        // Save the updated stamp details
        onSave({ ...stamp, ...stampDetails });
    };

    const handleInputChange = (key: string, value: string) => {
        setStampDetails((prevDetails) => ({
            ...prevDetails,
            [key]: value,
        }));
    };

    const handleIncrement = (key: string) => {
        setStampValuesAndOwnership((prevValues) => ({
          ...prevValues,
          [key]: [
            prevValues[key][0],
            (prevValues[key][1] || 0) + 1,
            prevValues[key][2]
          ]
        }));
      };
    
      const handleDecrement = (key: string) => {
        setStampValuesAndOwnership((prevValues) => ({
          ...prevValues,
          [key]: [
            prevValues[key][0],
            Math.max((prevValues[key][1] || 0) - 1, 0),
            prevValues[key][2]
          ]
        }));
      };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
          setImage(event.target.files[0]);
          // Handle the image upload logic here
        }
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
                        {stamp.image_path ? (
                            <img
                                src={`http://localhost:5000/images/${stamp.image_path.replace('./images_all_2/', '')}`}
                                
                                alt={stamp.set_name}
                                className={`stamp-modal-image ${isImageLoaded ? 'loaded' : ''}`}
                                onLoad={handleImageLoad}
                            />
                        ) : (
                            <div className="upload-button-container">
                                <input
                                    type="file"
                                    id="image-upload"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="image-upload" className="upload-button">
                                    Upload Image
                                </label>
                            </div>
                        )}
                    </div>
                    {/* make horizontal line */}
                    <hr className="modal-line" />
                    <div className="stamp-details-wrapper">
                        <div className="stamp-details">
                            {Object.keys(stampDetails).map((key) => (
                                <div key={key} className="stamp-detail">
                                    <div className="stamp-detail-label">{key}</div>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={stampDetails[key]}
                                            onChange={(e) => handleInputChange(key, e.target.value)}
                                            className="stamp-detail-input"
                                        />
                                    ) : (
                                        <div className="stamp-detail-value">{stampDetails[key]}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {!isEditing && (
                            <button className="edit-button" onClick={handleEditClick}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M12.1465 0.146447C12.3417 -0.0488155 12.6583 -0.0488155 12.8536 0.146447L15.8536 3.14645C16.0488 3.34171 16.0488 3.65829 15.8536 3.85355L5.85357 13.8536C5.80569 13.9014 5.74858 13.9391 5.68571 13.9642L0.68571 15.9642C0.500001 16.0385 0.287892 15.995 0.146461 15.8536C0.00502989 15.7121 -0.0385071 15.5 0.0357762 15.3143L2.03578 10.3143C2.06092 10.2514 2.09858 10.1943 2.14646 10.1464L12.1465 0.146447ZM11.2071 2.5L13.5 4.79289L14.7929 3.5L12.5 1.20711L11.2071 2.5ZM12.7929 5.5L10.5 3.20711L4.00001 9.70711V10H4.50001C4.77616 10 5.00001 10.2239 5.00001 10.5V11H5.50001C5.77616 11 6.00001 11.2239 6.00001 11.5V12H6.29291L12.7929 5.5ZM3.03167 10.6755L2.92614 10.781L1.39754 14.6025L5.21903 13.0739L5.32456 12.9683C5.13496 12.8973 5.00001 12.7144 5.00001 12.5V12H4.50001C4.22387 12 4.00001 11.7761 4.00001 11.5V11H3.50001C3.28561 11 3.10272 10.865 3.03167 10.6755Z" fill="#fff" />
                                </svg>
                            </button>
                        )}
                        {isEditing && (
                            <button className="save-button" onClick={handleSaveClick}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 11 10" fill="none">
                                    <path d="M9.73649 0.96967C10.0255 0.676777 10.4942 0.676777 10.7832 0.96967C11.0687 1.25897 11.0722 1.72582 10.7937 2.01947L4.88025 9.00973C4.87456 9.01693 4.86848 9.02381 4.86205 9.03033C4.573 9.32322 4.10437 9.32322 3.81532 9.03033L0.216784 5.38388C-0.0722613 5.09099 -0.0722613 4.61612 0.216784 4.32322C0.505829 4.03033 0.974464 4.03033 1.26351 4.32322L4.31638 7.41674L9.71686 0.992105C9.72295 0.984235 9.72951 0.976743 9.73649 0.96967Z" fill="#fff"/>
                                </svg>
                            </button>
                        )}
                    </div>
                    <hr className="modal-line" />
                    <div className="stamp-values-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Value</th>
                                    <th>Owned</th>
                                    <th>Total Value</th>
                                    <th>Adjust</th>
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
                                            <td>
                                                <div className="adjust-ownership">
                                                    <button className="decrement-button" onClick={() => handleDecrement(key)}>-</button>
                                                    <button className="increment-button" onClick={() => handleIncrement(key)}>+</button>
                                                </div>
                                            </td>
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
                    <hr className="modal-line" />
                    <div className="related-images">
                        {loading ? (
                            <div className="loading-text">Loading related images...</div>
                        ) : (
                            Object.values(relatedImages).map((img, index) => (
                                <div className='related-stamp-container' key={index}>
                                    {img &&
                                        <img
                                            key={index}
                                            src={`http://localhost:5000/images/${img.replace('./images_all_2/', '')}`}
                                            alt={`Related stamp ${index + 1}`}
                                            className="related-stamp-image"
                                        />
                                    }
                                    {/* if no image is available */}
                                    {!img &&
                                        <div key={ index } className="no-image-modal">No image <br/> available</div>
                                    }
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StampModal;
